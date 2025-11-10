

const mongoose = require("mongoose");
const { BlogPost, Author, Category, Tag, Comment } = require("../models/blog");


// ==================================================
// PUBLIC BLOG ROUTES
// ==================================================


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
    // 1. Get post data from req.body
    const { title, slug, summary, content, imageUrl, readTime, category, tags, isFeatured, status } = req.body;
    
    // 2. Get the logged-in user (admin or author) from the checkAuth middleware
    const loggedInUser = req.user;

    let postAuthor;

    // 3. Determine the author of the post based on role
    if (loggedInUser.role === 'author') {
      // If an AUTHOR is creating, they are the author.
      postAuthor = loggedInUser;
    } else if (loggedInUser.role === 'admin') {
      // If an ADMIN is creating, they MUST provide an 'authorId'
      const { authorId } = req.body;
      if (!authorId) {
        return res.status(400).json({ message: "Admin must provide an 'authorId' to create a post." });
      }
      // Find the author they are posting for
      const authorFromDb = await Author.findById(authorId);
      if (!authorFromDb) {
        return res.status(404).json({ message: "The specified author was not found." });
      }
      postAuthor = authorFromDb;
    } else {
      return res.status(403).json({ message: "Not authorized to create a post." });
    }

    // 4. Validate category
    const cat = await Category.findById(category);
    if (!cat) return res.status(404).json({ message: "Category not found." });

    // 5. Create the new post
    const newPost = new BlogPost({
      title,
      slug,
      summary,
      content,
      imageUrl,
      readTime,
      category: cat._id,
      author: { // Populate with the 'postAuthor' we determined
        id: postAuthor._id, 
        displayName: postAuthor.displayName, 
        profileImage: postAuthor.profileImage 
      },
      tags,
      isFeatured,
      status,
    });

    const savedPost = await newPost.save();
    
    // 6. Cleanup logic (remains the same)
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
    const { title, slug, summary, content, imageUrl, readTime, category, tags, isFeatured, status } = req.body;
    
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    // 1. Get the logged-in user (admin or author) from middleware
    const loggedInUser = req.user;

    // 2. --- NEW AUTHORIZATION LOGIC ---
    // Allow the update if:
    // 1. The user's role is 'admin'
    // 2. The user's role is 'author' AND their ID matches the post's author ID
    if (loggedInUser.role === 'admin' || (loggedInUser.role === 'author' && post.author.id.toString() === loggedInUser._id.toString())) {
      
      // User is authorized, proceed with update
      const updatedPost = await BlogPost.findByIdAndUpdate(
        req.params.id,
        { 
          title, slug, summary, content, imageUrl, readTime, 
          category, tags, isFeatured, status 
        },
        { new: true, runValidators: true }
      );
      res.status(200).json(updatedPost);

    } else {
      // User is not an admin and not the owner
      return res.status(403).json({ message: "Not authorized to update this post." });
    }
    
  } catch (error) {
    res.status(400).json({ message: "Error updating post.", error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  console.log(`🗑️ [DELETE] Deleting post ID: ${req.params.id}`);
  try {
    const postToDelete = await BlogPost.findById(req.params.id);
    if (!postToDelete) return res.status(404).json({ message: "Post not found." });

    // 1. Get the logged-in user (admin or author) from middleware
    const loggedInUser = req.user;

    // 2. --- NEW AUTHORIZATION LOGIC ---
    // Allow the delete if:
    // 1. The user's role is 'admin'
    // 2. The user's role is 'author' AND their ID matches the post's author ID
    if (loggedInUser.role === 'admin' || (loggedInUser.role === 'author' && postToDelete.author.id.toString() === loggedInUser._id.toString())) {
      
      // User is authorized, proceed with delete
      await BlogPost.findByIdAndDelete(req.params.id);
      
      // (Your cleanup logic is correct)
      await Comment.deleteMany({ postId: postToDelete._id });
      await Category.findByIdAndUpdate(postToDelete.category, { $inc: { postCount: -1 } });
      if (postToDelete.tags?.length) {
        for (const tag of postToDelete.tags) {
          await Tag.findOneAndUpdate({ slug: tag.slug }, { $inc: { postCount: -1 } });
        }
      }
      res.status(204).send();

    } else {
      // User is not an admin and not the owner
      return res.status(403).json({ message: "Not authorized to delete this post." });
    }
    
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
    // 1. Destructure the new fields from the request body
    const { 
      email, 
      password, 
      displayName, 
      title, 
      bio, 
      profileImage, 
      socialLinks 
    } = req.body;

    // 2. Update validation to include email and password
    if (!email || !password || !displayName) {
      return res.status(400).json({ 
        message: "Email, password, and display name are required." 
      });
    }

    // 3. Check for existing author by EMAIL (which should be unique)
    const existingAuthor = await Author.findOne({ email: email.toLowerCase() });
    if (existingAuthor) {
      return res.status(400).json({ 
        message: "An author with this email already exists." 
      });
    }

    // 4. Create the new Author instance
    // We pass the plain-text password here.
    // The 'pre-save' hook in your Mongoose schema will handle hashing it.
    const newAuthor = new Author({
      email: email.toLowerCase(), // Store email in lowercase for consistency
      password,
      displayName,
      title,
      bio,
      profileImage,
      socialLinks,
    });

    // 5. Save the new author
    const savedAuthor = await newAuthor.save();

    // 6. Send the response.
    // Because you added `select: false` to the password in the schema,
    // 'savedAuthor' will NOT include the password, which is secure.
    res.status(201).json(savedAuthor);

  } catch (error) {
    console.error("Error creating author:", error.message); // Good to log the error
    res.status(400).json({ 
      message: "Error creating author.", 
      error: error.message 
    });
  }
};

exports.authorLogin = async (req, res) => {
  console.log("🔒 [POST] Author login attempt...");
  
  try {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password." });
    }

    // 2. Find the Author by Email
    // We must use .select('+password') because the schema has 'select: false'
    const author = await Author.findOne({ email: email.toLowerCase() })
                               .select('+password');

    // 3. Check if author exists AND if password is correct
    // Use bcrypt.compare to check the plain text password against the stored hash
    if (!author || !(await bcrypt.compare(password, author.password))) {
      // Use a generic message for security
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4. If credentials are correct, create JWT payload
    const payload = {
      id: author._id, // This ID will be used by your 'protectAuthor' middleware
      name: author.displayName,
      email: author.email
    };

    // 5. Sign the token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET, // Make sure JWT_SECRET is in your .env file
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // 6. Send the successful response
    // Send the token and some user info (but never the password)
    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: {
        _id: author._id,
        email: author.email,
        displayName: author.displayName
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login.", error: error.message });
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
