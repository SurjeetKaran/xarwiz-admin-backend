const express = require("express");
const router = express.Router();
const {
  createContent,
  getContent,
  updateContent,
  deleteContent,
  getAllContent,
} = require("../controllers/serviceContentController");

// --- ADD THIS LINE ---
const { protectAdmin } = require("../middleware/authMiddleware"); // Adjust path as needed

// For each type (guest-posting / niche-edit)

// PUBLIC: Get content for the public-facing page
router.get("/:type", getContent);

// ADMIN-ONLY: Create, update, or delete content
router.post("/:type", protectAdmin, createContent);
router.put("/:type", protectAdmin, updateContent);
router.delete("/:type", protectAdmin, deleteContent);

// PUBLIC: Optional route to get all content
router.get("/", getAllContent);

module.exports = router;