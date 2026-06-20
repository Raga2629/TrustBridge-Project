import mongoose from 'mongoose';

const contactRequestSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, required: true },
    subject:  { type: String, required: true },
    message:  { type: String, required: true },
    status:   { type: String, enum: ['new','read','resolved'], default: 'new' },
    emailSent:{ type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('ContactRequest', contactRequestSchema);
