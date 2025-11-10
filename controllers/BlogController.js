

const mongoose = require("mongoose");
const { BlogPost, Author, Category, Tag, Comment } = require("../models/blog");

// ==================================================
// PUBLIC BLOG ROUTES
// ==================================================
// exports.getPublishedPosts = async (req, res) => {
//   console.log("📘 [GET] Fetching published blog posts...");
//   try {
//     const posts = await BlogPost.find({ status: "published" })
//       .select("title slug summary imageUrl publishDate readTime author commentCount")
//       .sort({ publishDate: -1 })
//       .limit(10);
//     res.status(200).json(posts);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching blog list.", error: error.message });
//   }
// };

exports.getPublishedPosts = async (req, res) => {
  console.log("📘 [GET] Fetching published blog posts...");
  try {
    const posts = await BlogPost.find({ status: "published" })
      .select("title slug summary content imageUrl publishDate readTime author commentCount")
      .sort({ publishDate: -1 }); // Removed the .limit(10)

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog list.", error: error.message });
  }
};

exports.getPostBySlug = async (req, res) => {
  console.log(`📄 [GET] Fetching post by slug: ${req.params.slug}`);
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, status: "published" })
      .populate("category", "name slug")
      .populate("author", "displayName profileImage title socialLinks bio");

    if (!post)
      return res.status(404).json({ message: "Blog post not found." });

    const comments = await Comment.find({ postId: post._id }).sort({ createdAt: 1 });
    const postDetail = { ...post.toObject(), comments, commentCount: comments.length };

    res.status(200).json(postDetail);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching blog post details.",
      error: error.message,
    });
  }
};

exports.getCategories = async (req, res) => {
  console.log("📂 [GET] Fetching all categories...");
  try {
    const categories = await Category.find()
      .select("name slug postCount subcategories")
      .sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories.", error: error.message });
  }
};

exports.getPopularTags = async (req, res) => {
  console.log("🏷️ [GET] Fetching popular tags...");
  try {
    const tags = await Tag.find().select("name slug").sort({ postCount: -1 }).limit(20);
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tags.", error: error.message });
  }
};

// ==================================================
// BLOG POSTS (ADMIN CRUD)
// ==================================================
exports.createPost = async (req, res) => {
  console.log("📝 [POST] Creating new blog post...");
  try {
    const { title, slug, summary, content, imageUrl, readTime, category, authorId, tags, isFeatured, status } = req.body;

    const author = await Author.findById(authorId).select("displayName profileImage");
    if (!author) return res.status(404).json({ message: "Author not found." });

    const cat = await Category.findById(category);
    if (!cat) return res.status(404).json({ message: "Category not found." });

    const newPost = new BlogPost({
      title,
      slug,
      summary,
      content,
      imageUrl,
      readTime,
      category: cat._id,
      author: { id: author._id, displayName: author.displayName, profileImage: author.profileImage },
      tags,
      isFeatured,
      status,
    });

    const savedPost = await newPost.save();
    await Category.findByIdAndUpdate(cat._id, { $inc: { postCount: 1 } });
    if (tags?.length) {
      for (const tag of tags) {
        await Tag.findOneAndUpdate({ slug: tag.slug }, { $inc: { postCount: 1 } });
      }
    }

    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ message: "Error creating post.", error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  console.log(`✏️ [PUT] Updating post ID: ${req.params.id}`);
  try {
    const { title, slug, summary, content, imageUrl, readTime, category, authorId, tags, isFeatured, status } = req.body;
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    let authorData = post.author;
    if (authorId) {
      const author = await Author.findById(authorId).select("displayName profileImage");
      if (!author) return res.status(404).json({ message: "Author not found." });
      authorData = { id: author._id, displayName: author.displayName, profileImage: author.profileImage };
    }

    const cat = await Category.findById(category || post.category);
    if (!cat) return res.status(404).json({ message: "Category not found." });

    const updatedPost = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { title, slug, summary, content, imageUrl, readTime, category: cat._id, author: authorData, tags, isFeatured, status },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: "Error updating post.", error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  console.log(`🗑️ [DELETE] Deleting post ID: ${req.params.id}`);
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: "Post not found." });

    await Comment.deleteMany({ postId: deletedPost._id });
    await Category.findByIdAndUpdate(deletedPost.category, { $inc: { postCount: -1 } });

    if (deletedPost.tags?.length) {
      for (const tag of deletedPost.tags) {
        await Tag.findOneAndUpdate({ slug: tag.slug }, { $inc: { postCount: -1 } });
      }
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting post.", error: error.message });
  }
};

exports.submitComment = async (req, res) => {
  console.log(`💬 [POST] Submitting comment for post ID: ${req.params.postId}`);
  try {
    const { postId } = req.params;
    const { name, mail, number, website, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid Post ID." });
    }

    if (!name || !mail || !number || !message) {
      return res.status(400).json({ message: "Name, email, number, and message are required fields." });
    }

    const newComment = new Comment({
      postId,
      authorName: name.trim(),
      authorEmail: mail.trim().toLowerCase(),
      authorNumber: number.trim(),
      authorWebsite: website?.trim() || null,
      content: message.trim(),
    });

    const savedComment = await newComment.save();
    await BlogPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    res.status(201).json({
      success: true,
      message: "Comment submitted successfully.",
      comment: savedComment,
    });
  } catch (error) {
    console.error("❌ Error submitting comment:", error);
    res.status(500).json({ success: false, message: "Error submitting comment.", error: error.message });
  }
};

// ==================================================
// AUTHOR MANAGEMENT
// ==================================================
exports.createAuthor = async (req, res) => {
  console.log("👤 [POST] Creating new author...");
  try {
    const { displayName, title, bio, profileImage, socialLinks } = req.body;
    if (!displayName) return res.status(400).json({ message: "Display name is required." });

    const existing = await Author.findOne({ displayName });
    if (existing) return res.status(400).json({ message: "Author already exists." });

    const saved = await new Author({ displayName, title, bio, profileImage, socialLinks }).save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: "Error creating author.", error: error.message });
  }
};

exports.getAllAuthors = async (req, res) => {
  console.log("👥 [GET] Fetching all authors...");
  try {
    const authors = await Author.find().sort({ displayName: 1 });
    res.status(200).json(authors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching authors.", error: error.message });
  }
};

exports.updateAuthor = async (req, res) => {
  console.log(`✏️ [PUT] Updating author ID: ${req.params.id}`);
  try {
    const { displayName, title, bio, profileImage, socialLinks } = req.body;
    const updated = await Author.findByIdAndUpdate(
      req.params.id,
      { displayName, title, bio, profileImage, socialLinks },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Author not found." });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error updating author.", error: error.message });
  }
};

exports.deleteAuthor = async (req, res) => {
  console.log(`🗑️ [DELETE] Deleting author ID: ${req.params.id}`);
  try {
    const deleted = await Author.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Author not found." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting author.", error: error.message });
  }
};

exports.getAuthorById = async (req, res) => {
  console.log(`👤 [GET] Fetching author by ID: ${req.params.id}`);
  try {
    const authorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ message: "Invalid author ID format." });
    }

    const author = await Author.findById(authorId).select("displayName title bio profileImage socialLinks");
    if (!author) return res.status(404).json({ message: "Author not found." });

    res.status(200).json(author);
  } catch (error) {
    console.error("Error fetching author:", error);
    res.status(500).json({ message: "Error fetching author.", error: error.message });
  }
};

// ==================================================
// CATEGORY + TAG MANAGEMENT
// ==================================================
exports.getAllCategories = async (req, res) => {
  console.log("📂 [GET] Fetching all categories (admin)...");
  try {
    const categories = await Category.find().select("name slug subcategories postCount").sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories.", error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  console.log("📁 [POST] Creating new category...");
  try {
    const { name, slug, subcategories } = req.body;
    if (!name || !slug) return res.status(400).json({ message: "Name and slug are required." });

    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ message: "Category slug already exists." });

    const newCategory = new Category({ name, slug, subcategories: Array.isArray(subcategories) ? subcategories : [] });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: "Error creating category.", error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  console.log(`✏️ [PUT] Updating category ID: ${req.params.id}`);
  try {
    const { name, slug, subcategories } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name, slug, subcategories: Array.isArray(subcategories) ? subcategories : [] },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Category not found." });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error updating category.", error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  console.log(`🗑️ [DELETE] Deleting category ID: ${req.params.id}`);
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting category.", error: error.message });
  }
};

exports.getSubcategoriesByCategory = async (req, res) => {
  console.log(`📚 [GET] Fetching subcategories for category ID: ${req.params.categoryId}`);
  try {
    const category = await Category.findById(req.params.categoryId).select("subcategories");
    if (!category) return res.status(404).json({ message: "Category not found." });
    res.status(200).json(category.subcategories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subcategories.", error: error.message });
  }
};

// TAGS
exports.getAllTags = async (req, res) => {
  console.log("🏷️ [GET] Fetching all tags...");
  try {
    const tags = await Tag.find().select("name slug postCount").sort({ name: 1 });
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tags.", error: error.message });
  }
};

exports.createTag = async (req, res) => {
  console.log("🏷️ [POST] Creating new tag...");
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ message: "Name and slug are required." });

    const existing = await Tag.findOne({ $or: [{ name }, { slug }] });
    if (existing) return res.status(400).json({ message: "Tag with this name or slug already exists." });

    const newTag = new Tag({ name, slug });
    const saved = await newTag.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: "Error creating tag.", error: error.message });
  }
};

exports.updateTag = async (req, res) => {
  console.log(`✏️ [PUT] Updating tag ID: ${req.params.id}`);
  try {
    const { name, slug } = req.body;
    const updated = await Tag.findByIdAndUpdate(
      req.params.id,
      { name, slug },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Tag not found." });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error updating tag.", error: error.message });
  }
};

exports.deleteTag = async (req, res) => {
  console.log(`🗑️ [DELETE] Deleting tag ID: ${req.params.id}`);
  try {
    const deleted = await Tag.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Tag not found." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting tag.", error: error.message });
  }
};
