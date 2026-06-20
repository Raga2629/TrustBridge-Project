import express from 'express';
import twilio from 'twilio';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import ResidentProfile from '../models/ResidentProfile.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload, uploadFields } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import { simulateFaceMatch } from '../utils/verification.js';
import { verifyAadhaarDocument } from '../utils/aadhaarOCR.js';
import { updateTrustScore } from '../utils/trustScore.js';
import { createNotification } from '../utils/notifications.js';

const router = express.Router();

/* ── Send OTP via Twilio (or fall back to dev console log) ── */
async function sendSMS(phone, otp) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;

  // Ensure number has + prefix
  const to = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

  const ready = sid && token && from &&
    sid   !== 'YOUR_TWILIO_ACCOUNT_SID' &&
    token !== 'YOUR_TWILIO_AUTH_TOKEN';

  if (!ready) {
    console.log(`[SMS-DEV] OTP for ${to}: ${otp}  (add Twilio keys to .env to send real SMS)`);
    return;
  }

  console.log(`[SMS] Sending OTP ${otp} to ${to} via Twilio…`);

  const client = twilio(sid, token);
  const msg = await client.messages.create({
    body: `Your TrustBridge verification OTP is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
    from,
    to,
  });

  console.log(`[SMS] Twilio sent. SID: ${msg.sid}, status: ${msg.status}`);
}

router.post('/otp/send', protect, authorize('resident'), asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new AppError('Phone number required', 400);

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await OTP.findOneAndUpdate(
    { phone },
    { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), verified: false },
    { upsert: true }
  );

  try {
    await sendSMS(phone, otp);
  } catch (err) {
    console.error('SMS send failed:', err.message);
    if (process.env.NODE_ENV !== 'development') {
      throw new AppError('Failed to send OTP. Please try again.', 500);
    }
  }

  // Show OTP in response only when Twilio keys are not configured (dev/demo mode)
  const twilioConfigured =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_ACCOUNT_SID !== 'YOUR_TWILIO_ACCOUNT_SID';

  res.json({
    success: true,
    message: 'OTP sent successfully',
    ...(!twilioConfigured && { otp }),
  });
}));

router.post('/otp/verify', protect, authorize('resident'), asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  const record = await OTP.findOne({ phone, otp, verified: false });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  record.verified = true;
  await record.save();

  await User.findByIdAndUpdate(req.user._id, { phone, phoneVerified: true });
  const profile = await ResidentProfile.findOneAndUpdate(
    { user: req.user._id },
    { 'verificationSteps.phone': true },
    { new: true }
  );

  res.json({ success: true, data: profile });
}));

// ── NEW: AI Aadhaar document upload + OCR verification ──────────────────────
router.post('/aadhaar/upload',
  protect,
  authorize('resident'),
  upload.single('aadhaar'),
  asyncHandler(async (req, res) => {

    if (!req.file) throw new AppError('Please upload your Aadhaar card image or PDF.', 400);

    console.log(`[Aadhaar] File received: ${req.file.originalname} | ${req.file.mimetype} | ${req.file.size} bytes`);

    // 1. Run AI OCR verification
    const result = await verifyAadhaarDocument(req.file.buffer, req.file.mimetype);

    // 2. Upload document image to Cloudinary (blurred/masked in production)
    let aadhaarImageUrl = '';
    try {
      aadhaarImageUrl = await uploadToCloudinary(req.file.buffer, 'trustbridge/aadhaar');
    } catch (err) {
      console.warn('[Aadhaar] Cloudinary upload failed (non-fatal):', err.message);
    }

    // 3. Decide verification outcome
    const isVerified      = result.status === 'verified';
    const isManualReview  = result.status === 'manual_review';
    const isRejected      = result.status === 'rejected';

    // 4. Update profile
    const updateData = {
      aadhaarImage: aadhaarImageUrl,
      'aadhaarVerification.verificationScore': result.verificationScore,
      'aadhaarVerification.ocrConfidence':     result.ocrConfidence,
      'aadhaarVerification.documentQuality':   result.documentQuality,
      'aadhaarVerification.tamperingRisk':     result.tamperingRisk,
      'aadhaarVerification.isAadhaarDocument': result.isAadhaarDocument,
      'aadhaarVerification.extractedName':     result.extractedName,
      'aadhaarVerification.extractedDob':      result.extractedDob,
      'aadhaarVerification.extractedAddress':  result.extractedAddress,
      'aadhaarVerification.aadhaarLastFour':   result.aadhaarLastFour,
      'aadhaarVerification.rejectionReason':   result.rejectionReason,
    };

    if (isVerified) {
      updateData['verificationSteps.aadhaar']        = true;
      updateData['verificationStatus']               = 'pending'; // full badge after address step
      updateData['aadhaarVerification.verifiedAt']   = new Date();
      if (result.extractedAddress) updateData['address'] = result.extractedAddress;
      if (result.aadhaarNumber)    updateData['aadhaarNumber'] = result.aadhaarNumber;
    } else if (isManualReview) {
      updateData['verificationStatus'] = 'manual_review';
    } else {
      updateData['verificationStatus'] = 'rejected';
    }

    const profile = await ResidentProfile.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true }
    );

    if (!profile) throw new AppError('Resident profile not found.', 404);

    // 5. Notify on failure so user knows what to fix
    if (isRejected || isManualReview) {
      await createNotification(
        req.user._id,
        'verification',
        isRejected ? 'Aadhaar Verification Failed' : 'Re-upload Required',
        result.rejectionReason
      ).catch(() => {});
    }

    console.log(`[Aadhaar] Done — score: ${result.verificationScore}, status: ${result.status}`);

    res.json({
      success: true,
      verification: {
        status:            result.status,
        verificationScore: result.verificationScore,
        ocrConfidence:     result.ocrConfidence,
        documentQuality:   result.documentQuality,
        tamperingRisk:     result.tamperingRisk,
        extractedName:     result.extractedName,
        extractedDob:      result.extractedDob,
        aadhaarLastFour:   result.aadhaarLastFour,
        rejectionReason:   result.rejectionReason,
        simulated:         result.simulated,
      },
      data: profile,
    });
  })
);

// ── KEEP old text-based route as fallback (manual entry) ────────────────────
router.post('/aadhaar', protect, authorize('resident'), asyncHandler(async (req, res) => {
  const { aadhaarNumber, address, yearsInArea } = req.body;
  if (!aadhaarNumber) throw new AppError('Aadhaar number is required', 400);
  const cleaned = String(aadhaarNumber).replace(/\D/g, '');
  if (cleaned.length !== 12) throw new AppError('Aadhaar number must be exactly 12 digits', 400);

  const profile = await ResidentProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      aadhaarNumber: cleaned,
      address: address || '',
      yearsInArea: Number(yearsInArea) || 0,
      'verificationSteps.aadhaar': true,
      'aadhaarVerification.verificationScore': 70,
      'aadhaarVerification.documentQuality': 'good',
      'aadhaarVerification.tamperingRisk': 'low',
    },
    { new: true }
  );
  if (!profile) throw new AppError('Resident profile not found.', 404);
  res.json({ success: true, data: profile });
}));

router.post('/selfie', protect, authorize('resident'), uploadFields, asyncHandler(async (req, res) => {
  if (!req.files?.selfie?.[0]) throw new AppError('Selfie required', 400);

  const selfieImage = await uploadToCloudinary(req.files.selfie[0].buffer, 'trustbridge/selfie');
  const faceResult = simulateFaceMatch();

  const profile = await ResidentProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      selfieImage,
      faceMatchScore: faceResult.score,
      'verificationSteps.selfie': true,
      'verificationSteps.faceMatch': faceResult.matched,
    },
    { new: true }
  );

  res.json({ success: true, data: profile, faceMatch: faceResult });
}));

router.post('/address', protect, authorize('resident'), asyncHandler(async (req, res) => {
  const { address } = req.body;

  const profile = await ResidentProfile.findOne({ user: req.user._id });
  if (!profile) throw new AppError('Resident profile not found', 404);

  // Complete verification once phone + aadhaar are done (selfie optional)
  const canComplete =
    profile.verificationSteps.phone &&
    profile.verificationSteps.aadhaar;

  profile.address = address || profile.address;
  profile.verificationSteps.address = true;

  if (canComplete) {
    profile.verificationStatus = 'verified';
    profile.isVerifiedBadge    = true;
    await createNotification(
      req.user._id, 'verification', 'Verification Complete ✅',
      'Congratulations! You are now a Verified Local Resident on TrustBridge.'
    ).catch(() => {});
  } else {
    profile.verificationStatus = 'pending';
  }

  await profile.save();
  await updateTrustScore(req.user._id);

  res.json({ success: true, data: profile });
}));

router.get('/status', protect, authorize('resident'), asyncHandler(async (req, res) => {
  const profile = await ResidentProfile.findOne({ user: req.user._id });
  res.json({ success: true, data: profile });
}));

router.put('/profile', protect, authorize('resident'), asyncHandler(async (req, res) => {
  const { bio, languages, specialties } = req.body;
  const profile = await ResidentProfile.findOneAndUpdate(
    { user: req.user._id },
    { bio, languages, specialties },
    { new: true }
  );
  res.json({ success: true, data: profile });
}));

export default router;
