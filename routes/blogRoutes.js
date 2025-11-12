const express = require("express");
const router = express.Router();
const blogController = require("../controllers/BlogController");
const { checkAuth, protectAdmin } = require('../middleware/authMiddleware');

// ======================================================================
// 📖 PUBLIC READ ROUTES
// ======================================================================

router.get("/blog/posts", blogController.getPublishedPosts);
router.get("/blog/post/:slug", blogController.getPostBySlug);
router.get("/blog/categories", blogController.getCategories);
router.get("/blog/categories/:categoryId/subcategories", blogController.getSubcategoriesByCategory);
router.get("/blog/tags", blogController.getPopularTags);
router.post("/blog/post/:postId/comments", blogController.submitComment);
router.get("/blog/author/:id", blogController.getAuthorById);

// ======================================================================
// 🔐 ADMIN CRUD ROUTES
// ======================================================================

// ---- Blog Posts (Protected by checkAuth - Admin or Author) ----
router.post("/admin/blog/posts", checkAuth, blogController.createPost);
router.put("/admin/blog/posts/:id", checkAuth, blogController.updatePost);
router.delete("/admin/blog/posts/:id", checkAuth, blogController.deletePost);
router.get("/blog/author/:id/posts", blogController.getPostsByAuthor);

// ---- Authors (Public for signup/login, Admin for management) ----
router.post("/admin/authors", blogController.createAuthor); // Public Signup

router.get("/admin/authors", blogController.getAllAuthors); // Admin-only
router.put("/admin/authors/:id", protectAdmin, blogController.updateAuthor);
router.delete("/admin/authors/:id", protectAdmin, blogController.deleteAuthor);

// ---- Categories (checkAuth for GET, protectAdmin for CUD) ----
// UPDATED: Both roles can read categories
router.get("/admin/categories", checkAuth, blogController.getAllCategories);
// Admin-only to create, update, or delete
router.post("/admin/categories", protectAdmin, blogController.createCategory);
router.put("/admin/categories/:id", protectAdmin, blogController.updateCategory);
router.delete("/admin/categories/:id", protectAdmin, blogController.deleteCategory);

// ---- Tags (checkAuth for GET, protectAdmin for CUD) ----
// UPDATED: Both roles can read tags
router.get("/admin/tags", checkAuth, blogController.getAllTags);
// Admin-only to create, update, or delete
router.post("/admin/tags", protectAdmin, blogController.createTag);
router.put("/admin/tags/:id", protectAdmin, blogController.updateTag);
router.delete("/admin/tags/:id", protectAdmin, blogController.deleteTag);

module.exports = router;
