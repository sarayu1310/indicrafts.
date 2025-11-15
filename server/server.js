const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
// app.use(cors());
app.use(
  cors({
    origin: [
      "https://indicrafts.netlify.app",
      "https://indicrafts.vercel.app",
      "http://localhost:8080",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Connect to MongoDB
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/reviews", reviewRoutes);

// Log all registered routes for debugging
console.log("Registered API routes:");
console.log("  - /api/auth");
console.log("  - /api/contact");
console.log("  - /api/products");
console.log("  - /api/admin");
console.log("  - /api/payments");
console.log("  - /api/shipping");
console.log("  - /api/reviews");
console.log("Review routes registered at /api/reviews");

// Catch-all handler for undefined routes (should be last)
app.use((req, res) => {
  console.error(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.error(`Request headers:`, req.headers);
  console.error(`Available routes: /api/admin/reviews, /api/reviews, etc.`);
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      "/api/health",
      "/api/admin/reviews",
      "/api/admin/orders",
      "/api/admin/products",
      "/api/reviews/test",
      "/api/reviews/product/:productId",
      "/api/reviews (POST)",
      "/api/reviews/:reviewId (PUT, DELETE)",
    ],
  });
});

// For Vercel serverless functions
module.exports = app;

// For local development or traditional server deployment
if (require.main === module) {
  app.listen(PORT, () => {
    // console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on port ${PORT}`);
  });
}
