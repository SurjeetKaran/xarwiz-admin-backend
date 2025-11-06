const express = require('express');
const router = express.Router();
const aboutContentController = require('../controllers/aboutContentController');

/**
 * Single About Page Routes
 * No ID needed — always targets the one stored document
 */

router.route('/')
    .post(aboutContentController.createAboutContent)  // Initialize (one-time only)
    .get(aboutContentController.getAboutContent)      // Fetch content
    .put(aboutContentController.updateAboutContent)   // Update content
    .delete(aboutContentController.deleteAboutContent); // Admin maintenance only

module.exports = router;
