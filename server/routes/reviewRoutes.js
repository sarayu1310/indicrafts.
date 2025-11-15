const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

// Log all requests to review routes for debugging
router.use((req, res, next) => {
  console.log(`[Review Routes] ${req.method} ${req.path}`);
  next();
});

// Test endpoint to verify review routes are registered
router.get("/test", (req, res) => {
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

// GET /api/reviews/product/:productId - Get reviews for a product (public)
router.get("/product/:productId", getProductReviews);

// POST /api/reviews - Create a review (authenticated customers only)
// Note: Using explicit path to ensure route matching
router.post("/", authenticateToken, requireRole(["customer"]), createReview);

// PUT /api/reviews/:reviewId - Update a review (authenticated, owner only)
router.put(
  "/:reviewId",
  authenticateToken,
  requireRole(["customer", "admin"]),
  updateReview
);

// DELETE /api/reviews/:reviewId - Delete a review (authenticated, owner or admin)
router.delete(
  "/:reviewId",
  authenticateToken,
  requireRole(["customer", "admin"]),
  deleteReview
);

module.exports = router;
