const mongoose = require('mongoose');

// ========================================================================
// 1. Feature Card Schema (Embedded)
// ========================================================================
const FeatureCardSchema = new mongoose.Schema({
  iconPath: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
}, { _id: false });

// ========================================================================
// 2. FAQ Item Schema (Embedded)
// ========================================================================
const FaqItemSchema = new mongoose.Schema({
  id: { type: String, required: true, trim: true },
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true },
}, { _id: false });

// ========================================================================
// 3. Guest Posting Schema (Main Document)
// ========================================================================
const GuestPostingSchema = new mongoose.Schema({
  featuresHeading: { type: String, required: true },
  featuresSubtext: { type: String, default: "" },
  featureCards: { type: [FeatureCardSchema], required: true, minlength: 1 },

  faqIntroHeading: { type: String, default: "Frequently Asked Questions" },
  faqIntroSubtext: { type: String, default: "" },
  faqs: { type: [FaqItemSchema], required: true, minlength: 1 }
}, { timestamps: true });

// ========================================================================
// 4. Niche Edit Schema (Main Document)
// ========================================================================
const NicheEditSchema = new mongoose.Schema({
  featuresHeading: { type: String, required: true },
  featuresSubtext: { type: String, default: "" },
  featureCards: { type: [FeatureCardSchema], required: true, minlength: 1 },

  faqIntroHeading: { type: String, default: "Frequently Asked Questions" },
  faqIntroSubtext: { type: String, default: "" },
  faqs: { type: [FaqItemSchema], required: true, minlength: 1 }
}, { timestamps: true });

// ========================================================================
// Model Exports
// ========================================================================
const GuestPosting = mongoose.model('GuestPosting', GuestPostingSchema);
const NicheEdit = mongoose.model('NicheEdit', NicheEditSchema);

module.exports = {
  GuestPosting,
  NicheEdit,
  FeatureCardSchema,
  FaqItemSchema
};

