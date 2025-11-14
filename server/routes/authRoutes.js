const express = require("express");
const multer = require("multer");
const {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDF files are allowed"), false);
    }
  },
});

// Public routes
router.post("/register", upload.single("certificate"), registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);

// Wishlist routes
router.get("/wishlist", authenticateToken, getWishlist);
router.post("/wishlist/:productId", authenticateToken, addToWishlist);
router.delete("/wishlist/:productId", authenticateToken, removeFromWishlist);

module.exports = router;
