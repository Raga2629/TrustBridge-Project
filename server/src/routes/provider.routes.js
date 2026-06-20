import express from 'express';
import ProviderProfile from '../models/ProviderProfile.js';
import Service from '../models/Service.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadFields } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import {
  simulateOCR, calculateProviderVerificationScore, validateAadhaar, validateGST,
} from '../utils/verification.js';
import { createNotification } from '../utils/notifications.js';

const router = express.Router();

router.post('/register', protect, authorize('provider'), uploadFields, asyncHandler(async (req, res) => {
  const { fullName, businessName, phone, address, aadhaarNumber, gstNumber } = req.body;

  const aadhaarValidation = validateAadhaar(aadhaarNumber);
  if (!aadhaarValidation.valid) throw new AppError(aadhaarValidation.reason, 400);

  if (gstNumber) {
    const gstValidation = validateGST(gstNumber);
    if (!gstValidation.valid) throw new AppError(gstValidation.reason, 400);
  }

  const documents = {};
  if (req.files?.aadhaar?.[0]) {
    documents.aadhaar = await uploadToCloudinary(req.files.aadhaar[0].buffer, 'trustbridge/provider');
  }
  if (req.files?.gstCertificate?.[0]) {
    documents.gstCertificate = await uploadToCloudinary(req.files.gstCertificate[0].buffer, 'trustbridge/provider');
  }
  if (req.files?.businessLicense?.[0]) {
    documents.businessLicense = await uploadToCloudinary(req.files.businessLicense[0].buffer, 'trustbridge/provider');
  }

  const ocrExtracted = simulateOCR('business', { fullName, businessName, gstNumber });
  const verification = calculateProviderVerificationScore(
    { fullName, businessName, phone, address, aadhaarNumber, gstNumber, documents },
    ocrExtracted
  );

  let verificationStatus = verification.status;
  if (verificationStatus === 'auto_approved') verificationStatus = 'verified';

  const profile = await ProviderProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      fullName, businessName, phone, address, aadhaarNumber, gstNumber,
      documents, ocrExtracted, verificationScore: verification.score,
      verificationStatus,
    },
    { new: true, upsert: true }
  );

  const message = verification.status === 'auto_approved'
    ? 'Your business has been automatically verified!'
    : verification.status === 'manual_review'
      ? 'Your application is under manual review.'
      : 'Your application was rejected. Please check your documents.';

  await createNotification(req.user._id, 'verification', 'Verification Update', message);

  res.json({
    success: true,
    data: profile,
    verification: { ...verification, status: verificationStatus },
  });
}));

router.get('/status', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  res.json({ success: true, data: profile });
}));

router.get('/analytics', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  const services = await Service.find({ provider: req.user._id, isActive: true });
  const serviceIds = services.map((s) => s._id);

  const Booking = (await import('../models/Booking.js')).default;
  const bookings = await Booking.find({ service: { $in: serviceIds } });

  const stats = {
    totalServices: services.length,
    activeServices: services.filter((s) => s.isVisible).length,
    totalBookings: bookings.length,
    completedBookings: bookings.filter((b) => b.status === 'completed').length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    revenue: profile?.totalRevenue || 0,
    averageRating: profile?.averageRating || 0,
    subscription: profile?.subscription,
  };

  res.json({ success: true, data: stats });
}));

export default router;
