const express = require('express');
const router = express.Router();
const {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getStats,
  createStat,
  updateStat,
  deleteStat,
  getFooterLinks,
  createFooterColumn,
  updateFooterColumn,
  deleteFooterColumn,
  getSiteInfo, // (NEW)
  createOrUpdateSiteInfo, // (NEW)
} = require('../controllers/indexController');

// Admin protection middleware
const { protectAdmin } = require('../middleware/authMiddleware');

// --- Custom Logging Middleware ---
const logRoute = (req, res, next) => {
  console.log(`[ROUTE_HIT] ${req.method} /api/index${req.path}`);
  next();
};

// --- Testimonial Routes ---
router.get('/testimonials', logRoute, getTestimonials); // Public
router.post('/testimonials', logRoute, protectAdmin, createTestimonial);
router.put('/testimonials/:id', logRoute, protectAdmin, updateTestimonial);
router.delete('/testimonials/:id', logRoute, protectAdmin, deleteTestimonial);

// --- Stat Routes ---
router.get('/stats', logRoute, getStats); // Public
router.post('/stats', logRoute, protectAdmin, createStat);
router.put('/stats/:id', logRoute, protectAdmin, updateStat);
router.delete('/stats/:id', logRoute, protectAdmin, deleteStat);

// --- Footer Link Routes ---
router.get('/footer-links', logRoute, getFooterLinks); // Public
router.post('/footer-links', logRoute, protectAdmin, createFooterColumn);
router.put('/footer-links/:id', logRoute, protectAdmin, updateFooterColumn);
router.delete('/footer-links/:id', logRoute, protectAdmin, deleteFooterColumn);

// --- Site Info Routes ---
router.get('/site-info', logRoute, getSiteInfo); // Public
router.put('/site-info', logRoute, protectAdmin, createOrUpdateSiteInfo);

module.exports = router;
