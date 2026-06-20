import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'booking', 'message', 'review', 'reward', 'trust_score',
        'subscription', 'payment', 'verification', 'fraud', 'system', 'community',
      ],
      required: true,
    },
    title:    { type: String, required: true },
    message:  { type: String, required: true },
    link:     { type: String, default: '' },   // clickable route e.g. /services/:id
    isRead:   { type: Boolean, default: false },
    metadata: mongoose.Schema.Types.Mixed,     // admin-only extra data, never sent to users
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
