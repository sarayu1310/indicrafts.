const express = require("express");
const multer = require("multer");
const { authenticateToken } = require("../middleware/auth");
const {
  submitReview,
  getProductReviews,
  updateHelpfulCount,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

// Use in-memory storage for multiple files (up to 5 images per review)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Max 5 images per review
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Get reviews for a product (public, no auth required)
router.get("/product/:productId", getProductReviews);

// Submit a review (authenticated users only)
router.post(
  "/",
  authenticateToken,
  upload.array("images", 5), // Accept up to 5 images
  submitReview
);

// Update helpful/not helpful count (authenticated users only)
router.post("/:reviewId/helpful", authenticateToken, updateHelpfulCount);

// Delete a review (authenticated users only - owner or admin)
router.delete("/:reviewId", authenticateToken, deleteReview);

module.exports = router;
