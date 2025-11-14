const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

// GET /api/reviews/product/:productId - Get reviews for a product (public)
router.get("/product/:productId", getProductReviews);

// POST /api/reviews - Create a review (authenticated customers only)
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
