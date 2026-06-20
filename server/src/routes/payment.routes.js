import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import ProviderProfile from '../models/ProviderProfile.js';
import Service from '../models/Service.js';
import Transaction from '../models/Transaction.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { createNotification, emitNotification } from '../utils/notifications.js';

const router = express.Router();

export const PLANS = {
  basic: {
    name:     'Basic',
    price:    process.env.NODE_ENV === 'production' ? 299  : 8,
    duration: 30,
    features: ['Service listing', 'Standard visibility', 'Email support', 'Up to 5 bookings/month'],
  },
  growth: {
    name:     'Growth',
    price:    process.env.NODE_ENV === 'production' ? 799  : 10,
    duration: 30,
    features: ['Priority listing', 'Analytics dashboard', 'Featured badge', 'Unlimited bookings', 'Phone support'],
  },
  premium: {
    name:     'Premium',
    price:    process.env.NODE_ENV === 'production' ? 1499 : 15,
    duration: 30,
    features: ['Top placement', 'Unlimited bookings', 'Premium support', 'Featured badge', 'Advanced analytics', 'Custom profile page'],
  },
  enterprise: {
    name:     'Enterprise',
    price:    process.env.NODE_ENV === 'production' ? 4999 : 20,
    duration: 30,
    features: ['Top placement', 'Promotional features', 'Advanced analytics'],
  },
};

console.log(`[Payment] NODE_ENV=${process.env.NODE_ENV} — plan prices: basic=${PLANS.basic.price} growth=${PLANS.growth.price} premium=${PLANS.premium.price}`);

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('your_key')) return null;
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ── Plans ─────────────────────────────────────────────────────────────────────
router.get('/plans', (req, res) => {
  res.json({ success: true, data: PLANS });
});

// ── Return Razorpay public key to frontend ────────────────────────────────────
router.get('/razorpay-key', (req, res) => {
  const key = process.env.RAZORPAY_KEY_ID;
  const configured = key && !key.includes('your_key');
  res.json({ success: true, data: { key: configured ? key : null, testMode: true } });
});

// ── Create Razorpay order ─────────────────────────────────────────────────────
router.post('/create-order', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const { plan, serviceId } = req.body;
  if (!PLANS[plan]) throw new AppError('Invalid plan', 400);

  const planDetails = PLANS[plan];
  const razorpay    = getRazorpay();

  // Create a pending transaction record
  const txn = await Transaction.create({
    provider:          req.user._id,
    service:           serviceId || null,
    plan,
    amount:            planDetails.price,
    status:            'pending',
    isMock:            !razorpay,
  });

  if (!razorpay) {
    // No Razorpay keys — return a mock order for test/dev
    console.log('[Payment] Razorpay not configured — returning mock order');
    const mockOrderId = `mock_order_${Date.now()}`;
    txn.razorpayOrderId = mockOrderId;
    await txn.save();
    return res.json({
      success: true,
      data: {
        orderId:       mockOrderId,
        amount:        planDetails.price * 100,
        currency:      'INR',
        plan,
        mock:          true,
        transactionId: txn._id,
        keyId:         null,
      },
    });
  }

  const receipt = `TB${Date.now()}`;
  console.log('[Payment] Receipt:', receipt, '| length:', receipt.length);  // always < 20 chars

  const order = await razorpay.orders.create({
    amount:   planDetails.price * 100,
    currency: 'INR',
    receipt,
    notes:    { plan, userId: req.user._id.toString(), transactionId: txn._id.toString() },
  });

  console.log('[Payment] Full Razorpay order object:', JSON.stringify(order, null, 2));
  console.log('[Payment] Verification — currency:', order.currency, '| amount_paise:', order.amount, '| amount_inr:', order.amount / 100, '| order_id:', order.id);

  txn.razorpayOrderId = order.id;
  await txn.save();

  res.json({
    success: true,
    data: {
      orderId:       order.id,
      amount:        order.amount,
      currency:      order.currency,
      plan,
      mock:          false,
      transactionId: txn._id,
      keyId:         process.env.RAZORPAY_KEY_ID,
    },
  });
}));

// ── Verify payment & activate subscription ────────────────────────────────────
router.post('/verify', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const {
    plan,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    transactionId,
    mock,
  } = req.body;

  if (!PLANS[plan]) throw new AppError('Invalid plan', 400);

  // Find the pending transaction
  const txn = await Transaction.findById(transactionId);
  if (!txn) throw new AppError('Transaction not found', 404);
  if (txn.provider.toString() !== req.user._id.toString()) throw new AppError('Unauthorized', 403);

  // ── Signature verification (skip only in genuine mock/test mode) ──────────
  const isMockOrder = mock === true || (razorpay_order_id && razorpay_order_id.startsWith('mock_'));

  if (!isMockOrder) {
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('your_key')) {
      throw new AppError('Razorpay not configured on server', 500);
    }
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expectedSig !== razorpay_signature) {
      txn.status = 'failed';
      txn.failureReason = 'Signature mismatch';
      await txn.save();
      throw new AppError('Payment verification failed — signature mismatch', 400);
    }
    console.log(`[Payment] Signature verified ✓ order=${razorpay_order_id} payment=${razorpay_payment_id}`);
  } else {
    console.log('[Payment] Mock payment — skipping signature verification');
  }

  // ── Update transaction record ─────────────────────────────────────────────
  txn.razorpayPaymentId  = razorpay_payment_id || `mock_pay_${Date.now()}`;
  txn.razorpaySignature  = razorpay_signature  || 'mock_sig';
  txn.status             = 'success';
  await txn.save();

  // ── Activate subscription ─────────────────────────────────────────────────
  const startDate = new Date();
  const endDate   = new Date(startDate.getTime() + PLANS[plan].duration * 24 * 60 * 60 * 1000);

  const profile = await ProviderProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      subscription: {
        plan,
        status:                  'active',
        startDate,
        endDate,
        razorpaySubscriptionId:  txn.razorpayPaymentId,
        transactionId:           txn._id,
      },
    },
    { new: true }
  );

  // ── Activate ONLY the verified service (not all services) ────────────────
  if (txn.service) {
    const svc = await Service.findById(txn.service);
    if (svc && svc.docVerification?.identityPassed) {
      svc.isVisible      = true;
      svc.isFeatured     = ['premium', 'enterprise', 'growth'].includes(plan);
      svc.workflowStatus = 'published';
      await svc.save();
      console.log(`[Payment] Service ${txn.service} published`);
    } else {
      console.log(`[Payment] Service ${txn.service} not published — identity not verified`);
    }
  }

  const io = req.app.get('io');
  const notification = await createNotification(
    req.user._id, 'subscription', 'Subscription Activated',
    `Your ${PLANS[plan].name} plan is now active! Your service is live.`,
    '/dashboard/provider'
  );
  emitNotification(io, req.user._id.toString(), notification);

  console.log(`[Payment] ✓ Subscription activated: ${plan} for user ${req.user._id}`);

  res.json({ success: true, data: { profile, transaction: txn } });
}));

// ── Handle payment failure ────────────────────────────────────────────────────
router.post('/failure', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const { transactionId, reason } = req.body;
  if (transactionId) {
    await Transaction.findByIdAndUpdate(transactionId, {
      status:        'failed',
      failureReason: reason || 'User cancelled or payment declined',
    });
  }
  res.json({ success: true, message: 'Payment failure recorded' });
}));

// ── Get subscription status ───────────────────────────────────────────────────
router.get('/subscription', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });

  if (profile?.subscription?.endDate && new Date(profile.subscription.endDate) < new Date()) {
    profile.subscription.status = 'expired';
    await profile.save();
    await Service.updateMany({ provider: req.user._id }, { isVisible: false, isFeatured: false });
  }

  res.json({ success: true, data: profile?.subscription, plans: PLANS });
}));

// ── Payment history ───────────────────────────────────────────────────────────
router.get('/history', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ provider: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('service', 'title');
  res.json({ success: true, data: transactions });
}));

export default router;
