// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const indexRoutes = require("./routes/indexRoute"); // CommonJS import
const blogRoutes = require("./routes/blogRoutes"); // CommonJS import
const serviceContentRoutes = require('./routes/serviceContentRoutes'); // CommonJS import
const aboutRoutes = require('./routes/aboutRoutes'); // CommonJS import

dotenv.config();

// -----------------------------
// Initialize Express app
// -----------------------------
const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(
  cors({
    origin: "*", // allow only your Vite frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // if you plan to use cookies or auth headers
  })
);

console.log("🟢 Express app initialized");

// -----------------------------
// MongoDB Connection
// -----------------------------
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });


// Optional root redirect
app.get("/", (req, res) => res.redirect("/admin/login"));

// -----------------------------
// Token generation function
// -----------------------------
const generateToken = (username) => {
  return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// -----------------------------
// Admin Login API
// -----------------------------
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log("🔑 POST /api/v1/admin/login called");
  console.log("[REQUEST_BODY]", req.body);

  // Check missing fields
  if (!username || !password) {
    console.warn("⚠️ Missing username or password in request");
    return res.status(400).json({
      success: false,
      message: "Please provide username and password",
    });
  }

  // Check credentials
  if (username === adminUsername && password === adminPassword) {
    const token = generateToken(username);
    console.log(`✅ Admin login successful for username: ${username}`);
    return res.json({
      success: true,
      message: "Admin login successful",
      token,
    });
  } else {
    console.warn(`❌ Admin login failed for username: ${username}`);
    return res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }
});


// -----------------------------
// Index API Routes
// -----------------------------
app.use("/api/index", indexRoutes);
console.log("🛣️ Index API routes registered");

app.use("/api", blogRoutes);
console.log("🛣️ Blog API routes registered");

app.use('/api/service-content', serviceContentRoutes);
console.log("🛣️ server-content API routes registered");

app.use('/api/about-content', aboutRoutes);
console.log("🛣️ About Us API routes registered");


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
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
