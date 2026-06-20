import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    newcomer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    amount: { type: Number, required: true },
    percentage: { type: Number, required: true },
    trustScoreAtTime: Number,
    type: { type: String, enum: ['wallet', 'coupon', 'discount'], default: 'wallet' },
    status: { type: String, enum: ['pending', 'credited', 'redeemed'], default: 'credited' },
  },
  { timestamps: true }
);

export default mongoose.model('Reward', rewardSchema);
