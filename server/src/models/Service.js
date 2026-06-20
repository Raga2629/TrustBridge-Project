import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderProfile' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: String,
    location: { type: String, required: true },
    city: { type: String, default: 'Hyderabad' },
    address: String,
    coordinates: { lat: Number, lng: Number },
    images: [String],
    price: { type: Number, default: 0 },
    priceUnit: { type: String, default: 'fixed' },
    availability: {
      monday: { open: String, close: String, closed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
      friday: { open: String, close: String, closed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, closed: { type: Boolean, default: true } },
    },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Workflow status
    workflowStatus: {
      type: String,
      enum: ['draft', 'docs_pending', 'docs_uploaded', 'verifying', 'verified', 'payment_pending', 'admin_review', 'published', 'rejected', 'paused'],
      default: 'draft',
    },
    // Document verification — each field is optional; only set when that doc is uploaded
    documents: {
      aadhaar:          { type: mongoose.Schema.Types.Mixed },
      pan:              { type: mongoose.Schema.Types.Mixed },
      gst:              { type: mongoose.Schema.Types.Mixed },
      businessLicense:  { type: mongoose.Schema.Types.Mixed },
      registrationCert: { type: mongoose.Schema.Types.Mixed },
    },
    docVerification: {
      score:             { type: Number, default: 0 },
      status:            { type: String, enum: ['pending','verified','failed'], default: 'pending' },
      checkedAt:         Date,
      reason:            String,
      currentStage:      { type: String, default: '' },
      failureReasons:    [String],
      documentResults:   { type: mongoose.Schema.Types.Mixed, default: {} },
      // Tiered verification
      verificationLevel: { type: Number, default: 0 },  // 0=none, 1=identity, 2=business
      identityPassed:    { type: Boolean, default: false },
      businessPassed:    { type: Boolean, default: false },
    },
    // Contact & business info
    contactNumber: String,
    businessEmail: String,
    website:       String,
    recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

serviceSchema.index({ location: 1, category: 1 });
serviceSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Service', serviceSchema);
