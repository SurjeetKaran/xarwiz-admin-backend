const express = require("express");
const router = express.Router();
const {
  createContent,
  getContent,
  updateContent,
  deleteContent,
  getAllContent,
} = require("../controllers/serviceContentController");

// For each type (guest-posting / niche-edit)
router.get("/:type", getContent);
router.post("/:type", createContent);
router.put("/:type", updateContent);
router.delete("/:type", deleteContent);

// Optional: to get both together
router.get("/", getAllContent);

module.exports = router;

