import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    provider:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service:           { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    plan:              { type: String, required: true },
    amount:            { type: Number, required: true },   // in rupees
    currency:          { type: String, default: 'INR' },
    // Razorpay IDs
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    // Status
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
    },
    failureReason:     { type: String },
    // Meta
    isMock:            { type: Boolean, default: false },
  },
  { timestamps: true }
);

transactionSchema.index({ provider: 1, createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);
