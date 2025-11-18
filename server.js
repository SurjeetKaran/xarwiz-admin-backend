
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const indexRoutes = require("./routes/indexRoute");
const blogRoutes = require("./routes/blogRoutes");
const serviceContentRoutes = require("./routes/serviceContentRoutes");
const aboutRoutes = require("./routes/aboutRoutes");
const {Author} = require('./models/blog');

dotenv.config();

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.use(
  cors({
    origin: [
      "https://xarwiz-admin-frontend.vercel.app", // your Vercel frontend URL
      "http://localhost:8000",
      "https://xarwiz.com", 
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


console.log("🟢 Express app initialized");

// -----------------------------
// Health check
// -----------------------------
app.get("/health", (req, res) => {
res.json({ status: "ok", message: "Server is alive" });
});

// -----------------------------
// MongoDB connection
// -----------------------------
const connectDB = async () => {
try {
await mongoose.connect(process.env.DATABASE_URL);
console.log("✅ MongoDB connected");
} catch (err) {
console.error("❌ MongoDB connection error:", err);
process.exit(1);
}
};
connectDB();

// -----------------------------
// JWT Token generation
// -----------------------------
const generateToken = (username) => {
return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// -----------------------------
// Admin Login
// -----------------------------
// --- Your Updated Login Route ---
app.post("/api/admin/login", async (req, res) => {
  // 1. Get ONLY email and password (role is no longer sent)
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    });
  }

  try {
    let userPayload = null;

    // ==========================================
    // CHECK 1: IS IT THE SUPER ADMIN?
    // ==========================================
    const adminEmail = process.env.ADMIN_USERNAME; // e.g., "admin@xarwiz.com"
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if email matches admin (Case insensitive check is safer for emails)
    if (email.toLowerCase() === adminEmail.toLowerCase()) {
      // Verify Admin Password
      if (password === adminPassword) {
        userPayload = {
          id: 'admin_user_01', // Static ID for admin
          email: adminEmail,
          role: 'admin' // ✅ Role determined automatically
        };
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid admin password",
        });
      }
    }

    // ==========================================
    // CHECK 2: IS IT AN AUTHOR? (Only if not Admin)
    // ==========================================
    if (!userPayload) {
      // Find author by email
      const author = await Author.findOne({ email: email.toLowerCase() }).select('+password');

      // If author found, verify password
      if (author) {
        const isMatch = await bcrypt.compare(password, author.password);
        if (isMatch) {
          userPayload = {
            id: author._id,
            email: author.email,
            name: author.displayName,
            role: 'author' // ✅ Role determined automatically
          };
        } else {
           return res.status(401).json({
            success: false,
            message: "Invalid author password",
          });
        }
      }
    }

    // ==========================================
    // FINAL RESULT
    // ==========================================
    
    // If userPayload is still null, the user doesn't exist in either system
    if (!userPayload) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate Token
    const token = jwt.sign(
      userPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Success Response
    return res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        name: userPayload.name, // Admin will have undefined name, which is fine
        role: userPayload.role // Frontend needs this to know where to redirect
      }
    });

  } catch (error) {
    console.error("Login server error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login."
    });
  }
});

// -----------------------------
// API Routes
// -----------------------------
app.use("/api/index", indexRoutes);
app.use("/api", blogRoutes);
app.use("/api/service-content", serviceContentRoutes);
app.use("/api/about-content", aboutRoutes);

console.log("🛣️ API routes registered");

// -----------------------------
// Global error handler
// -----------------------------
app.use((err, req, res, next) => {
console.error("❌ Global Error:", err.message, err.stack);
res.status(500).json({ message: "Internal Server Error" });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
console.log(`🚀 Server running on port ${PORT}`)
);
