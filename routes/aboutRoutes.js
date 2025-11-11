const express = require('express');
const router = express.Router();
const aboutContentController = require('../controllers/aboutContentController');

// --- ADD THIS LINE ---
const { protectAdmin } = require('../middleware/authMiddleware'); // Adjust path as needed

/**
 * Single About Page Routes
 * No ID needed — always targets the one stored document
 */

router.route('/')
    // --- UPDATED: Admin-only ---
    .post(protectAdmin, aboutContentController.createAboutContent) // Initialize

    // --- PUBLIC: Anyone can read the About Us page content ---
    .get(aboutContentController.getAboutContent) // Fetch content

    // --- UPDATED: Admin-only ---
    .put(protectAdmin, aboutContentController.updateAboutContent) // Update content

    // --- UPDATED: Admin-only ---
    .delete(protectAdmin, aboutContentController.deleteAboutContent); // Admin maintenance

module.exports = router;
