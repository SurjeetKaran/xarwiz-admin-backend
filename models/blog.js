const mongoose = require('mongoose');

// =========================================================================
// 1. Author Schema (Manages Blogger Profile in Sidebar)
// =========================================================================


const AuthorSchema = new mongoose.Schema(
  {
    // Automatically generated internal user ID (no need to send from frontend)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(), // auto-create
      unique: true,
      required: true,
    },

    // --- NEW: Email Field ---
    email: {
      type: String,
      required: [true, "Email is required"], // Added required validation
      unique: true, // Ensures no two authors have the same email
      lowercase: true, // Stores email in lowercase
      trim: true, // Removes whitespace
    },

    // --- NEW: Password Field ---
    password: {
      type: String,
      required: [true, "Password is required"], // Added required validation
      select: false, // Hides password by default on queries
    },

    // Display name (e.g., "Rosalina D. Willaim")
    displayName: { type: String, required: true },

    // Role/Title (e.g., "Blogger/Photographer")
    title: { type: String },

    // Brief biography/description (used in the sidebar widget)
    bio: { type: String },

    // URL to the author's profile image
    profileImage: { type: String },

    // Social Media Links (matches the footer/sidebar social icons)
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      youtube: { type: String },
    },
  },
  { timestamps: true }
);


// =========================================================================
// 2. Category Schema (Manages Categories/Subcategories in Sidebar)
// =========================================================================

const CategorySchema = new mongoose.Schema({
    // Name visible in the sidebar (e.g., "Mobile Set")
    name: { type: String, required: true, unique: true },
    // Slug for clean URLs (e.g., "mobile-set")
    slug: { type: String, required: true, unique: true },
    // Optional subcategories (embedded for fast lookup)
    subcategories: [{
        name: { type: String, required: true },
        slug: { type: String, required: true }
    }],
    // Count of posts in this category (for the sidebar counter, updated via post middleware)
    postCount: { type: Number, default: 0 }
}, { timestamps: true });

// =========================================================================
// 3. Tag Schema (Manages "Popular Tags" in Sidebar)
// =========================================================================

const TagSchema = new mongoose.Schema({
    // Name visible on the page (e.g., "Tourist")
    name: { type: String, required: true, unique: true },
    // Slug for clean URLs (e.g., "tourist-tag")
    slug: { type: String, required: true, unique: true },
    // Count of posts associated with this tag
    postCount: { type: Number, default: 0 }
}, { timestamps: true });

// =========================================================================
// 4. Comment Schema (Manages post comments)
// Note: Stored in a separate collection to prevent large document size.
// =========================================================================

const CommentSchema = new mongoose.Schema(
  {
    // 🔗 Blog post this comment belongs to
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogPost",
      required: true,
      index: true,
    },

    // 🧑 Commenter's name
    authorName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    // 📧 Commenter's email
    authorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // 📞 Commenter's phone number
    authorNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // 🌐 Optional website URL
    authorWebsite: {
      type: String,
      trim: true,
    },

    // 💬 Actual comment content
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true, // auto adds createdAt, updatedAt
  }
);



// =========================================================================
// 5. Blog Post Schema (The Main Content Source)
// =========================================================================

const BlogPostSchema = new mongoose.Schema({
    // --- Core Content & SEO ---
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: { type: String, required: true }, 
    content: { type: String, required: true }, 
    
    // --- Display Metadata ---
    // The date displayed (e.g., "24 Feb")
    publishDate: { type: Date, default: Date.now, index: true }, 
    // The URL for the main list image
    imageUrl: { type: String, required: true }, 
    // Estimated reading time (e.g., 3 for "3 min Read")
    readTime: { type: Number, required: true }, 
    
    // --- Relationships & Filtering ---
    
    // Referenced Category (for filtering)
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true
    },
    
    // Embedded Author Details (denormalized for fast reads)
    author: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
        displayName: { type: String, required: true },
        profileImage: { type: String }
    },

    // Embedded Tags (denormalized from Tag collection for quick display/search)
    tags: [{
        name: { type: String },
        slug: { type: String }
    }],
    
    // --- Dynamic Metrics & State ---
    // Total approved comments (used for display, updated via comment middleware)
    commentCount: { type: Number, default: 0 },
    
    // Boolean to easily filter for the "Recent News" sidebar section
    isFeatured: { type: Boolean, default: false }, 
    
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' }

}, { timestamps: true });


// =========================================================================
// Mongoose Model Exports
// =========================================================================

const Author = mongoose.model('Author', AuthorSchema);
const Category = mongoose.model('Category', CategorySchema);
const Tag = mongoose.model('Tag', TagSchema);
const Comment = mongoose.model('Comment', CommentSchema);
const BlogPost = mongoose.model('BlogPost', BlogPostSchema);

module.exports = {
    Author,
    Category,
    Tag,
    Comment,
    BlogPost
};