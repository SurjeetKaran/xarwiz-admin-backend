const mongoose = require('mongoose');

// --- 1. Testimonial Schema ---
// For the "What People Love About Us" section
const testimonialSchema = new mongoose.Schema({
  quote: {
    type: String,
    required: [true, 'Testimonial quote is required.'],
    trim: true,
  },
  authorName: {
    type: String,
    required: [true, 'Author name is required.'],
    trim: true,
  },
  authorInfo: {
    type: String, // e.g., "SEO Consultant (New York, USA)"
    required: [true, 'Author info is required.'],
    trim: true,
  },
  authorImage: {
    type: String, // URL to the image (e.g., "assets/images/thumbs/emily.jpeg")
    required: false, // Optional
  },
}, { timestamps: true });

// --- 2. Stat Schema ---
// For the "7K+", "150+", "2k+" counter section
const statSchema = new mongoose.Schema({
  value: {
    type: String, // Using String to allow "7K+" or "2k+"
    required: [true, 'Stat value is required.'],
  },
  label: {
    type: String, // e.g., "Registered Websites"
    required: [true, 'Stat label is required.'],
  },
}, { timestamps: true });

// --- 3. Footer Link Column Schema ---
// For managing footer link columns like "Company" and "Legals"
const footerLinkColumnSchema = new mongoose.Schema({
  columnTitle: {
    type: String, // e.g., "Company", "Legals"
    required: [true, 'Column title is required.'],
    unique: true,
  },
  links: [
    {
      text: {
        type: String, // e.g., "About Us", "Privacy Policy"
        required: true,
      },
      url: {
        type: String, // e.g., "/about.html", "/privacypolicy.html"
        required: true,
      },
    }
  ]
}, { timestamps: true });

// --- 4. Site Info Schema (NEW) ---
// For general site settings like logo, footer description, etc.
// This is designed to be a "singleton" - only one document of this type.

const siteInfoSchema = new mongoose.Schema({
  logoUrl: {
    type: String,
    default: 'assets/images/logo/xarvislogo.png', // Default value
  },
  footerDescription: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  copyrightText: {
    type: String,
    trim: true,
  },
  
  // === ADD THIS NEW OBJECT ===
  socialLinks: {
    facebook: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    }
  }
  // ===========================

}, { timestamps: true });

// Remember to export your model
// const SiteInfo = mongoose.model('SiteInfo', siteInfoSchema);
// module.exports = SiteInfo;

// --- Export All Models ---
const Testimonial = mongoose.model('Testimonial', testimonialSchema);
const Stat = mongoose.model('Stat', statSchema);
const FooterLinkColumn = mongoose.model('FooterLinkColumn', footerLinkColumnSchema);
const SiteInfo = mongoose.model('SiteInfo', siteInfoSchema); // (NEW)

module.exports = {
  Testimonial,
  Stat,
  FooterLinkColumn,
  SiteInfo, // (NEW)
};