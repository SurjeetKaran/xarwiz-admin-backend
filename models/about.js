const mongoose = require('mongoose');

/* ===========================================================
   Embedded Schema → About Feature Card
   Used for: About Section Cards
=========================================================== */
const AboutFeatureCardSchema = new mongoose.Schema({
    iconPath: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
}, { _id: false }); // ✅ prevents unnecessary objectId in array


/* ===========================================================
   Embedded Schema → Pricing Table Feature Checklist Item
=========================================================== */
const PlanFeatureSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
}, { _id: false });


/* ===========================================================
   Embedded Schema → Individual Pricing Plan Box
=========================================================== */
const PricingPlanSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true },
    priceLabel: { type: String, default: "/Monthly" },
    ctaUrl: { type: String, required: true, trim: true },
    features: {
        type: [PlanFeatureSchema],
        required: true,
        validate: v => v.length > 0
    }
}, { timestamps: true });


/* ===========================================================
   Main Single Document Schema: About Page
   ✅ Only One Document Allowed
=========================================================== */
const AboutContentSchema = new mongoose.Schema({
    documentName: {
        type: String,
        required: true,
        unique: true,
        default: "ABOUT_PAGE",
        immutable: true
    },

    // About Section
    featuresMainHeading: { type: String, required: true },
    featuresSubHeading: { type: String },

    featureCards: {
        type: [AboutFeatureCardSchema],
        required: true,
        validate: v => v.length >= 4 // ✅ strictly 4 default cards
    },

    // Pricing Section
    pricingMainHeading: { type: String, required: true },
    pricingSubHeading: { type: String, required: true },

    pricingPlans: {
        type: [PricingPlanSchema],
        required: true,
        validate: v => v.length >= 3 // ✅ strictly 3 default plans
    }

}, { timestamps: true });


// ===========================================================
module.exports = mongoose.model("AboutContent", AboutContentSchema);
