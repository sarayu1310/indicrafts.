const Review = require("../models/Review");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// GET /api/reviews/product/:productId - Get all reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get reviews with pagination
    const reviews = await Review.find({ product: productId })
      .populate("user", "name firstName lastName email")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Review.countDocuments({ product: productId });

    // Calculate statistics
    const statsResult = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: { $push: "$rating" },
        },
      },
    ]);

    let stats = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    if (statsResult.length > 0) {
      stats.averageRating =
        Math.round((statsResult[0].averageRating || 0) * 10) / 10;
      stats.totalReviews = statsResult[0].totalReviews || 0;

      // Count rating distribution
      statsResult[0].ratingDistribution.forEach((rating) => {
        if (rating >= 1 && rating <= 5) {
          stats.ratingDistribution[rating] =
            (stats.ratingDistribution[rating] || 0) + 1;
        }
      });
    }

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch reviews", error: err.message });
  }
};

// POST /api/reviews - Create a new review
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    // Validation
    if (!productId || !rating) {
      return res
        .status(400)
        .json({ message: "Product ID and rating are required" });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      return res
        .status(400)
        .json({ message: "Rating must be an integer between 1 and 5" });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating: Number(rating),
      comment: comment?.trim() || "",
    });

    // Populate user data
    await review.populate("user", "name firstName lastName email");

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }
    console.error("Error creating review:", err);
    res
      .status(500)
      .json({ message: "Failed to create review", error: err.message });
  }
};

// PUT /api/reviews/:reviewId - Update a review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (String(review.user) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own reviews" });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
        return res
          .status(400)
          .json({ message: "Rating must be an integer between 1 and 5" });
      }
      review.rating = Number(rating);
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    review.edited = true;
    review.editedAt = new Date();

    await review.save();
    await review.populate("user", "name firstName lastName email");

    res.json({
      message: "Review updated successfully",
      review,
    });
  } catch (err) {
    console.error("Error updating review:", err);
    res
      .status(500)
      .json({ message: "Failed to update review", error: err.message });
  }
};

// DELETE /api/reviews/:reviewId - Delete a review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership or admin
    if (String(review.user) !== String(userId) && userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "You can only delete your own reviews" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res
      .status(500)
      .json({ message: "Failed to delete review", error: err.message });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};
