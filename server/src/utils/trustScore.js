import ResidentProfile from '../models/ResidentProfile.js';

export const calculateTrustScore = (profile) => {
  let score = 50;

  if (profile.verificationStatus === 'verified') score += 20;
  else if (profile.verificationStatus === 'pending') score += 5;

  score += Math.min(profile.yearsInArea * 2, 15);
  score += Math.min(profile.averageRating * 4, 20);
  score += Math.min(profile.helpfulInteractions * 0.5, 10);
  score += Math.min(profile.communityPosts * 0.3, 5);

  if (profile.totalRatings > 0 && profile.averageRating < 2.5) score -= 15;
  if (profile.verificationStatus === 'rejected') score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
};

export const updateTrustScore = async (userId) => {
  const profile = await ResidentProfile.findOne({ user: userId });
  if (!profile) return null;

  const oldScore = profile.trustScore;
  profile.trustScore = calculateTrustScore(profile);
  profile.isVerifiedBadge = profile.verificationStatus === 'verified' &&
    profile.verificationSteps.phone &&
    profile.verificationSteps.aadhaar &&
    profile.verificationSteps.selfie &&
    profile.verificationSteps.faceMatch &&
    profile.verificationSteps.address;

  await profile.save();
  return { profile, changed: oldScore !== profile.trustScore, oldScore };
};

export const getRewardPercentage = (trustScore) => {
  if (trustScore >= 80) return 15;
  if (trustScore >= 60) return 10;
  if (trustScore >= 50) return 5;
  return 3;
};
