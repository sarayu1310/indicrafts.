const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
// Parse URL-encoded bodies (e.g., traditional HTML forms or axios sending urlencoded)
app.use(express.urlencoded({ extended: true }));
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

app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Body exists:', !!req.body);
  console.log('Body keys:', req.body ? Object.keys(req.body) : 'none');
  console.log('File exists:', !!req.file);
  
  // Only log body content for non-production environments
  if (process.env.NODE_ENV !== 'production' && req.body) {
    console.log('Body preview:', JSON.stringify(req.body).substring(0, 200));
  }
  
  next();
});

// Routes
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const shippingRoutes = require("./routes/shippingRoutes");

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
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipping", shippingRoutes);

// Catch-all handler for undefined routes (should be last)
app.use((req, res) => {
  console.error(`404 - Route not found: ${req.method} ${req.originalUrl}`);
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
