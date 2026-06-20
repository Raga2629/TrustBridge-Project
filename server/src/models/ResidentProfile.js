import mongoose from 'mongoose';

const residentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Community identity
    bio:              { type: String, default: '' },
    connectionToArea: { type: String, enum: ['local_resident','student','employee','business_owner','other'], default: 'local_resident' },
    area:             { type: String, default: '' },
    areasOfExpertise: [{ type: String }],
    languages:        [String],
    // Contribution metrics
    questionsAnswered:    { type: Number, default: 0 },
    helpfulVotes:         { type: Number, default: 0 },
    recommendationsShared:{ type: Number, default: 0 },
    communityPosts:       { type: Number, default: 0 },
    helpfulInteractions:  { type: Number, default: 0 },
    totalRatings:         { type: Number, default: 0 },
    averageRating:        { type: Number, default: 0 },
    totalRecommendations: { type: Number, default: 0 },
    // Earnings
    walletBalance:  { type: Number, default: 0 },
    // Legacy — kept for backwards compat
    trustScore:         { type: Number, default: 0 },
    verificationStatus: { type: String, default: 'unverified' },
    isVerifiedBadge:    { type: Boolean, default: false },
    address:            String,
    yearsInArea:        { type: Number, default: 0 },
    specialties:        [String],
  },
  { timestamps: true }
);

export default mongoose.model('ResidentProfile', residentProfileSchema);
