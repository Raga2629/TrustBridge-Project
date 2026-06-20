import express from 'express';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Reward from '../models/Reward.js';
import ResidentProfile from '../models/ResidentProfile.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { createNotification, emitNotification } from '../utils/notifications.js';
import { getRewardPercentage, updateTrustScore } from '../utils/trustScore.js';

const router = express.Router();

const processReward = async (booking, io) => {
  if (!booking.recommendedBy || booking.rewardProcessed) return;

  const profile = await ResidentProfile.findOne({ user: booking.recommendedBy });
  if (!profile) return;

  const percentage = getRewardPercentage(profile.trustScore);
  const amount = Math.round((booking.amount * percentage) / 100);

  await Reward.create({
    resident: booking.recommendedBy,
    booking: booking._id,
    newcomer: booking.newcomer,
    service: booking.service,
    amount,
    percentage,
    trustScoreAtTime: profile.trustScore,
    type: 'wallet',
    status: 'credited',
  });

  profile.walletBalance += amount;
  profile.totalRecommendations += 1;
  profile.helpfulInteractions += 1;
  await profile.save();
  await updateTrustScore(booking.recommendedBy);

  booking.rewardProcessed = true;
  await booking.save();

  const notification = await createNotification(
    booking.recommendedBy, 'reward', 'Reward Earned!',
    `You earned ₹${amount} (${percentage}%) for your recommendation.`,
    '/dashboard/resident/rewards'
  );
  emitNotification(io, booking.recommendedBy.toString(), notification);
};

router.post('/', protect, authorize('newcomer'), asyncHandler(async (req, res) => {
  const { serviceId, date, time, notes, recommendedBy } = req.body;
  const service = await Service.findById(serviceId);
  if (!service || !service.isVisible) throw new AppError('Service not available', 404);

  // ── Duplicate booking prevention ─────────────────────────────────────────
  const bookingDate = new Date(date);
  const existing = await Booking.findOne({
    newcomer: req.user._id,
    service:  serviceId,
    date:     bookingDate,
    time:     time,
    status:   { $nin: ['cancelled'] },
  });
  if (existing) {
    throw new AppError('You already have a booking for this service at this date and time.', 409);
  }

  const booking = await Booking.create({
    service: serviceId,
    newcomer: req.user._id,
    provider: service.provider,
    recommendedBy: recommendedBy || service.recommendedBy,
    date:   bookingDate,
    time,
    notes,
    amount: service.price,
  });

  service.totalBookings += 1;
  await service.save();

  const io = req.app.get('io');

  // Notify provider — link to provider bookings dashboard
  const providerNotif = await createNotification(
    service.provider, 'booking',
    '📅 New Booking Request',
    `You have a new booking request for "${service.title}". Please confirm or decline.`,
    '/dashboard/provider'
  );
  emitNotification(io, service.provider.toString(), providerNotif);

  // Notify newcomer — link to their bookings page
  const newcomerNotif = await createNotification(
    req.user._id, 'booking',
    '✅ Booking Submitted',
    `Your booking for "${service.title}" is pending confirmation by the provider.`,
    '/bookings'
  );
  emitNotification(io, req.user._id.toString(), newcomerNotif);

  const populated = await Booking.findById(booking._id)
    .populate('service', 'title category location images price contactNumber')
    .populate('newcomer', 'name avatar')
    .populate('provider', 'name avatar');

  res.status(201).json({ success: true, data: populated });
}));

router.get('/my', protect, asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'newcomer') filter.newcomer = req.user._id;
  else if (req.user.role === 'provider') filter.provider = req.user._id;

  const bookings = await Booking.find(filter)
    .populate('service', 'title category location images price')
    .populate('newcomer', 'name avatar')
    .populate('provider', 'name avatar')
    .populate('recommendedBy', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: bookings });
}));

router.patch('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id)
    .populate('service', 'title')
    .populate('newcomer', 'name')
    .populate('provider', 'name');
  if (!booking) throw new AppError('Booking not found', 404);

  const isProvider = req.user.role === 'provider' &&
    booking.provider._id.toString() === req.user._id.toString();
  const isNewcomer = req.user.role === 'newcomer' &&
    booking.newcomer._id.toString() === req.user._id.toString();

  if (!isProvider && !isNewcomer)
    throw new AppError('Not authorized', 403);

  // Role-based status restrictions
  const PROVIDER_ALLOWED = ['confirmed', 'completed', 'cancelled'];
  const NEWCOMER_ALLOWED = ['cancelled'];

  if (isProvider && !PROVIDER_ALLOWED.includes(status))
    throw new AppError(`Providers can only set status to: ${PROVIDER_ALLOWED.join(', ')}`, 400);
  if (isNewcomer && !NEWCOMER_ALLOWED.includes(status))
    throw new AppError('Customers can only cancel bookings', 400);

  booking.status = status;
  await booking.save();

  const io = req.app.get('io');
  const svcTitle = booking.service?.title || 'your service';

  if (status === 'completed') {
    await processReward(booking, io);
    const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
    await ProviderProfile.findOneAndUpdate(
      { user: booking.provider._id },
      { $inc: { totalBookings: 1, totalRevenue: booking.amount } }
    );
  }

  // Notification content per status
  const STATUS_MESSAGES = {
    confirmed:  { title:'✅ Booking Confirmed',  msg:`Your booking for "${svcTitle}" has been confirmed by the provider.` },
    completed:  { title:'🎉 Booking Completed',  msg:`Your booking for "${svcTitle}" has been marked as completed. Please leave a review!` },
    cancelled:  { title:'❌ Booking Cancelled',  msg:`Your booking for "${svcTitle}" has been cancelled.` },
  };
  const PROVIDER_MESSAGES = {
    cancelled:  { title:'❌ Booking Cancelled',  msg:`A customer has cancelled their booking for "${svcTitle}".` },
  };

  // Notify the other party
  if (isProvider) {
    const m = STATUS_MESSAGES[status];
    if (m) {
      const notif = await createNotification(
        booking.newcomer._id, 'booking', m.title, m.msg, '/bookings'
      );
      emitNotification(io, booking.newcomer._id.toString(), notif);
    }
  } else {
    const m = PROVIDER_MESSAGES[status];
    if (m) {
      const notif = await createNotification(
        booking.provider._id, 'booking', m.title, m.msg, '/dashboard/provider'
      );
      emitNotification(io, booking.provider._id.toString(), notif);
    }
  }

  const updated = await Booking.findById(booking._id)
    .populate('service', 'title category location images price contactNumber')
    .populate('newcomer', 'name avatar')
    .populate('provider', 'name avatar');

  res.json({ success: true, data: updated });
}));

export default router;
