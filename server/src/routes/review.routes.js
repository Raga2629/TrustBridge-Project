/**
 * Review Routes — TrustBridge
 *
 * Binary flow:
 *   Validation → ML prediction → Approve (verified) | Reject (rejected)
 *   No verification queue. Instant decision.
 */
import express from 'express';
import Review          from '../models/Review.js';
import Service         from '../models/Service.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { protect, authorize }    from '../middleware/auth.js';
import { uploadFields }          from '../middleware/upload.js';
import { asyncHandler }          from '../middleware/errorHandler.js';
import { AppError }              from '../utils/AppError.js';
import { uploadMultiple }        from '../utils/cloudinaryUpload.js';
import { analyzeReview, checkRelevance } from '../utils/fakeReviewDetection.js';
import { createNotification, emitNotification } from '../utils/notifications.js';

const router = express.Router();

// ── recalculate service rating from verified reviews only ────────────────────
async function recalcServiceRating(serviceId) {
  const verified = await Review.find({ service: serviceId, status: 'verified' });
  const avg = verified.length
    ? verified.reduce((s, r) => s + r.rating, 0) / verified.length
    : 0;
  await Service.findByIdAndUpdate(serviceId, {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews:  verified.length,
  });
  const svc = await Service.findById(serviceId).select('provider');
  if (svc) {
    await ProviderProfile.findOneAndUpdate(
      { user: svc.provider },
      { averageRating: Math.round(avg * 10) / 10, totalReviews: verified.length }
    );
  }
}

// ── GET /reviews/service/:serviceId — public, verified only ─────────────────
router.get('/service/:serviceId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    service: req.params.serviceId,
    status:  { $in: ['verified', 'published'] },   // published = legacy verified
  })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  // Strip all AI/internal data before sending to client
  const safe = reviews.map(r => ({
    _id:       r._id,
    rating:    r.rating,
    content:   r.content,
    images:    r.images,
    status:    'verified',
    createdAt: r.createdAt,
    user:      r.user,
  }));

  res.json({ success: true, data: safe });
}));

// ── POST /reviews — protected ─────────────────────────────────────────────────
// Accepts multipart/form-data (with optional images) OR application/json (no images)
router.post('/', protect, uploadFields, asyncHandler(async (req, res) => {
  const { serviceId, rating, content, bookingId } = req.body;

  if (!serviceId || !rating || !content?.trim())
    throw new AppError('serviceId, rating, and content are required', 400);

  const service = await Service.findById(serviceId);
  if (!service) throw new AppError('Service not found', 404);

  // ── One review per service per user ──────────────────────────────────────
  // Only block if a VERIFIED review exists — rejected reviews allow resubmission.
  console.log('[Review] Duplicate check — userId:', req.user._id.toString(), '| serviceId:', serviceId);
  const alreadyReviewed = await Review.findOne({
    service: serviceId,
    user:    req.user._id,
    status:  { $in: ['verified', 'published'] },
  }).select('_id');
  console.log('[Review] Existing verified review found:', alreadyReviewed ? alreadyReviewed._id.toString() : 'none');

  if (alreadyReviewed)
    throw new AppError('You have already reviewed this service.', 409);

  // ── Relevance check — ensure review is about this service ───────────────
  const relevance = await checkRelevance(
    content,
    service.title,
    service.category,
    service.description || ''
  );
  console.log('[Review] Relevance —', service.title, '| score:', relevance.similarityScore, '| relevant:', relevance.isRelevant);

  if (!relevance.isRelevant) {
    return res.status(400).json({
      success: false,
      message: 'Review cannot be submitted.',
      reason:  'unrelated_to_service',
    });
  }

  // ── Build context ─────────────────────────────────────────────────────────
  const existingReviews = await Review.find({ service: serviceId }).select('content');
  const userReviews     = await Review.find({ user: req.user._id }).sort({ createdAt: 1 });
  const userActivity    = {
    reviewCount: userReviews.length,
    avgRating:   userReviews.length
      ? userReviews.reduce((s, r) => s + r.rating, 0) / userReviews.length
      : 3,
    timeSpan: userReviews.length > 1
      ? new Date(userReviews[userReviews.length - 1].createdAt) - new Date(userReviews[0].createdAt)
      : Infinity,
  };

  // ── Run ML + rule detection ───────────────────────────────────────────────
  const analysis = await analyzeReview(
    content,
    existingReviews.map(r => r.content),
    userActivity
  );

  const io = req.app.get('io');
  const serviceName = service.title;
  const serviceLink = `/services/${serviceId}`;

  // ── REJECTED — return 400 immediately, no DB record ──────────────────────
  if (analysis.decision === 'reject') {
    // Notify user with specific reason
    const notification = await createNotification(
      req.user._id,
      'review',
      '❌ Review Not Accepted',
      `Your review for ${serviceName} could not be published.`,
      serviceLink,
      { serviceId, action: 'review_rejected' }
    );
    emitNotification(io, req.user._id.toString(), notification);

    return res.status(400).json({
      success: false,
      message: 'Review cannot be submitted.',
      reason:  analysis.reason,
    });
  }

  // ── APPROVED — save and publish immediately ───────────────────────────────
  // Upload review photos if provided (max 5, optional)
  let images = [];
  if (req.files?.images?.length) {
    const files = req.files.images.slice(0, 5); // enforce max 5
    try {
      images = await uploadMultiple(files, 'trustbridge/reviews');
    } catch (uploadErr) {
      console.warn('[Review] Image upload failed (non-fatal):', uploadErr.message);
      images = []; // fail gracefully — still save the review without images
    }
  }

  const review = await Review.create({
    service:  serviceId,
    user:     req.user._id,
    booking:  bookingId || undefined,
    rating:   Number(rating),
    content,
    images,
    status:   'verified',
    aiAnalysis: {
      mlPrediction:      analysis.mlPrediction,
      mlFakeProbability: analysis.mlFakeProbability,
      mlConfidence:      analysis.mlConfidence,
      mlModelAvailable:  analysis.mlModelAvailable,
      ruleScore:         analysis.ruleScore,
      spamFlags:         analysis.spamFlags,
      isDuplicate:       analysis.isDuplicate,
      riskScore:         analysis.riskScore,
      finalDecision:     'approve',
      decisionReason:    '',
      analyzedAt:        new Date(),
    },
    fakeDetection: {
      ruleScore:         analysis.ruleScore,
      mlScore:           analysis.mlScore,
      riskScore:         analysis.riskScore,
      fakeProbability:   analysis.fakeProbability,
      genuineProbability:analysis.genuineProbability,
      reasons:           analysis.reasons,
    },
  });

  // ── Recalc service rating (verified reviews only) ─────────────────────────
  await recalcServiceRating(serviceId);

  // ── Notify user — meaningful message with service name ────────────────────
  const notification = await createNotification(
    req.user._id,
    'review',
    '✅ Review Published',
    `Your review for ${serviceName} has been published.`,
    serviceLink,
    { serviceId, reviewId: review._id.toString(), action: 'review_published' }
  );
  emitNotification(io, req.user._id.toString(), notification);

  // ── Send only public-safe fields to client ────────────────────────────────
  const clientReview = {
    _id:       review._id,
    rating:    review.rating,
    content:   review.content,
    images:    review.images,
    status:    'verified',
    createdAt: review.createdAt,
  };

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully. Your review has been verified.',
    data:    clientReview,
  });
}));

// ── GET /reviews/pending — admin: suspicious/flagged legacy ──────────────────
router.get('/pending', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    status: { $in: ['suspicious', 'pending_review', 'flagged', 'pending_verification'] },
  })
    .populate('user',    'name email')
    .populate('service', 'title category')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
}));

// ── GET /reviews/admin/all — admin full list with AI data ────────────────────
router.get('/admin/all', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('user',    'name email')
    .populate('service', 'title category')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, data: reviews });
}));

// ── PATCH /reviews/:id/moderate — admin manual override ──────────────────────
router.patch('/:id/moderate', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { action } = req.body;   // 'approve' | 'reject'
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  review.status = action === 'approve' ? 'verified' : 'rejected';
  await review.save();

  if (action === 'approve') await recalcServiceRating(review.service);

  res.json({ success: true, data: review });
}));

export default router;
