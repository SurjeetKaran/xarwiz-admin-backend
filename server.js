
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
      "https://xarwiz.com" 
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
app.post("/api/admin/login", async (req, res) => { // Made this async
  
  // 1. Get all three fields from the body
  // Note: Your form must send 'email' now, not 'username'
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Please provide email, password, and role",
    });
  }

  try {
    let userPayload;

    // -------------------------
    // --- ADMIN LOGIN LOGIC ---
    // -------------------------
    if (role === 'admin') {
      const adminEmail = process.env.ADMIN_USERNAME; // Assumes this is the admin's email
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (email === adminEmail && password === adminPassword) {
        // Create the payload for the admin JWT
        userPayload = {
          id: 'admin_user_01', // Static ID for the admin
          email: adminEmail,
          role: 'admin' // CRITICAL: Add the role
        };
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid admin email or password",
        });
      }

    // --------------------------
    // --- AUTHOR LOGIN LOGIC ---
    // --------------------------
    } else if (role === 'author') {
      
      // Find the author in the database by their email
      const author = await Author.findOne({ email: email.toLowerCase() })
                                 .select('+password');

      // Check if author exists and password is correct using bcrypt
      if (!author || !(await bcrypt.compare(password, author.password))) {
        return res.status(401).json({
          success: false,
          message: "Invalid author email or password",
        });
      }

      // Create the payload for the author JWT
      userPayload = {
        id: author._id,
        email: author.email,
        name: author.displayName,
        role: 'author' // CRITICAL: Add the role
      };

    // --------------------------
    // --- INVALID ROLE ---
    // --------------------------
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified. Must be 'admin' or 'author'."
      });
    }

    // ------------------------------------
    // --- TOKEN GENERATION (Successful Login) ---
    // ------------------------------------
    
    // We replace your 'generateToken' function with the standard jwt.sign
    // This ensures the payload (with the role) is included
    const token = jwt.sign(
      userPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Send the token and user info (excluding password)
    return res.json({
      success: true,
      message: `${role} login successful`,
      token: token,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        name: userPayload.name, // Will be undefined for admin, that's fine
        role: userPayload.role
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
