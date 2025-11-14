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

// Test endpoint to verify review routes are registered
app.get("/api/reviews/test", (req, res) => {
  res.json({
    message: "Review routes are working",
    timestamp: new Date().toISOString(),
    routes: [
      "GET /api/reviews/product/:productId",
      "POST /api/reviews",
      "PUT /api/reviews/:reviewId",
      "DELETE /api/reviews/:reviewId",
    ],
  });
});

console.log("Review routes registered at /api/reviews");

// Catch-all handler for undefined routes (should be last)
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
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
