
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const indexRoutes = require("./routes/indexRoute");
const blogRoutes = require("./routes/blogRoutes");
const serviceContentRoutes = require("./routes/serviceContentRoutes");
const aboutRoutes = require("./routes/aboutRoutes");

dotenv.config();

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.use(
cors({
origin: ["[https://xarwiz-admin-frontend.vercel.app](https://xarwiz-admin-frontend.vercel.app)"], // Replace with your frontend URL
methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allowedHeaders: ["Content-Type", "Authorization"],
credentials: true,
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
app.post("/api/admin/login", (req, res) => {
const { username, password } = req.body;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!username || !password) {
return res.status(400).json({
success: false,
message: "Please provide username and password",
});
}

if (username === adminUsername && password === adminPassword) {
const token = generateToken(username);
return res.json({
success: true,
message: "Admin login successful",
token,
});
} else {
return res.status(401).json({
success: false,
message: "Invalid username or password",
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
