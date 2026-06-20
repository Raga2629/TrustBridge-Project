import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    images:  [String],

    // ── Moderation status — binary only ────────────────────────────────────
    // verified  → published publicly, affects ratings
    // rejected  → blocked, never shown
    status: {
      type: String,
      enum: ['verified', 'rejected',
             'published', 'pending_review', 'blocked', 'flagged',  // legacy compat
             'pending_verification', 'suspicious'],                 // legacy compat
      default: 'verified',
    },

    // ── AI & rule engine data (admin-only, never sent to users) ────────────
    aiAnalysis: {
      // ML model output
      mlPrediction:       { type: String, enum: ['fake','genuine','unknown'], default: 'unknown' },
      mlFakeProbability:  { type: Number, default: 0 },
      mlConfidence:       { type: Number, default: 0 },
      mlModelAvailable:   { type: Boolean, default: false },
      // Rule-based output
      ruleScore:          { type: Number, default: 0 },
      spamFlags:          [String],
      isDuplicate:        { type: Boolean, default: false },
      // Combined
      trustScore:         { type: Number, default: 100 }, // 0-100, higher = more trustworthy
      riskScore:          { type: Number, default: 0  }, // 0-100, higher = more risky
      finalDecision:      { type: String, enum: ['approve','flag','reject'], default: 'approve' },
      decisionReason:     { type: String, default: '' },
      analyzedAt:         { type: Date },
    },

    // legacy fields kept for backward compat
    fakeDetection: {
      ruleScore:          { type: Number, default: 0 },
      mlScore:            { type: Number, default: 0 },
      riskScore:          { type: Number, default: 0 },
      fakeProbability:    { type: Number, default: 0 },
      genuineProbability: { type: Number, default: 0 },
      reasons:            [String],
    },
  },
  { timestamps: true }
);

reviewSchema.index({ service: 1, user: 1 });
reviewSchema.index({ status: 1 });

export default mongoose.model('Review', reviewSchema);
