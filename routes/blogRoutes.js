const express = require("express");
const router = express.Router();
const blogController = require("../controllers/BlogController");
const { checkAuth } = require('../middleware/authMiddleware');

// ======================================================================
// 📖 PUBLIC READ ROUTES
// (Used by blog.html & blog-details.html)
// ======================================================================

// Fetch all published blog posts
router.get("/blog/posts", blogController.getPublishedPosts);

// Fetch a single blog post by slug
router.get("/blog/post/:slug", blogController.getPostBySlug);

// Fetch all categories (with subcategories for sidebar)
router.get("/blog/categories", blogController.getCategories);

// Fetch subcategories under a specific category
router.get("/blog/categories/:categoryId/subcategories", blogController.getSubcategoriesByCategory);

// Fetch popular tags (for sidebar)
router.get("/blog/tags", blogController.getPopularTags);

// Submit a comment on a post
router.post("/blog/post/:postId/comments", blogController.submitComment);

// Fetch author public profile
router.get("/blog/author/:id", blogController.getAuthorById);

// ======================================================================
// 🔐 ADMIN CRUD ROUTES
// (Protected under /api prefix from server.js)
// ======================================================================

// ---- Blog Posts ----
router.post("/admin/blog/posts", checkAuth, blogController.createPost);
router.put("/admin/blog/posts/:id", checkAuth, blogController.updatePost);
router.delete("/admin/blog/posts/:id", checkAuth, blogController.deletePost);

// ---- Authors ----
router.post("/admin/authors", blogController.createAuthor);
router.post("/admin/login", blogController.authorLogin);
router.get("/admin/authors", blogController.getAllAuthors);
router.put("/admin/authors/:id", blogController.updateAuthor);
router.delete("/admin/authors/:id", blogController.deleteAuthor);

// ---- Categories ----
router.get("/admin/categories", blogController.getAllCategories);
router.post("/admin/categories", blogController.createCategory);
router.put("/admin/categories/:id", blogController.updateCategory);
router.delete("/admin/categories/:id", blogController.deleteCategory);

// ---- Tags ----
router.get("/admin/tags", blogController.getAllTags);
router.post("/admin/tags", blogController.createTag);
router.put("/admin/tags/:id", blogController.updateTag);
router.delete("/admin/tags/:id", blogController.deleteTag);

module.exports = router;
