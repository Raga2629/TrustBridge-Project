import express from 'express';
import Reward from '../models/Reward.js';
import ResidentProfile from '../models/ResidentProfile.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', protect, authorize('resident'), asyncHandler(async (req, res) => {
  const rewards = await Reward.find({ resident: req.user._id })
    .populate('service', 'title category')
    .populate('newcomer', 'name avatar')
    .sort({ createdAt: -1 });

  const profile = await ResidentProfile.findOne({ user: req.user._id });

  const stats = {
    walletBalance: profile?.walletBalance || 0,
    totalEarnings: rewards.reduce((s, r) => s + r.amount, 0),
    totalRewards: rewards.length,
    trustScore: profile?.trustScore || 0,
    rewardPercentage: profile?.trustScore >= 80 ? 15 : profile?.trustScore >= 60 ? 10 : 5,
  };

  res.json({ success: true, data: { rewards, stats } });
}));

export default router;
