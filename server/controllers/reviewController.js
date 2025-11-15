const Review = require("../models/Review");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const { cloudinary } = require("../services/cloudinary");

// Helper function to upload images to Cloudinary
const uploadImageToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "indicrafts/reviews", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

// @desc Submit a new review
const submitReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    // Validation
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        message: "Product ID, rating, title, and comment are required",
      });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Check if product exists
    const product = await Product.findById(productObjectId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productObjectId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    // Upload images if provided
    const reviewImages = [];
    if (req.files && req.files.length > 0) {
      // Limit to 5 images per review
      const filesToUpload = req.files.slice(0, 5);
      for (const file of filesToUpload) {
        try {
          const uploadResult = await uploadImageToCloudinary(file.buffer);
          reviewImages.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
          });
        } catch (error) {
          console.error("Error uploading review image:", error);
          // Continue with other images even if one fails
        }
      }
    }

    // Create review
    const review = await Review.create({
      product: productObjectId,
      user: req.user._id,
      userName:
        req.user.name ||
        `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
        "Anonymous",
      userEmail: req.user.email,
      rating: ratingNum,
      title: title.trim(),
      comment: comment.trim(),
      images: reviewImages,
    });

    // Populate user info for response
    await review.populate("user", "name firstName lastName email");

    return res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "recent" } = req.query;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "helpful":
        sortObj = { helpfulCount: -1, createdAt: -1 };
        break;
      case "rating-high":
        sortObj = { rating: -1, createdAt: -1 };
        break;
      case "rating-low":
        sortObj = { rating: 1, createdAt: -1 };
        break;
      case "recent":
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    // Get reviews
    const reviews = await Review.find({
      product: productObjectId,
      isApproved: true,
    })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate("user", "name firstName lastName")
      .lean();

    // Get total count
    const total = await Review.countDocuments({
      product: productObjectId,
      isApproved: true,
    });

    // Calculate rating statistics
    const ratingStats = await Review.aggregate([
      {
        $match: {
          product: productObjectId,
          isApproved: true,
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      {
        $match: {
          product: productObjectId,
          isApproved: true,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const avgRating = avgRatingResult[0]?.avgRating || 0;
    const totalReviews = avgRatingResult[0]?.totalReviews || 0;

    // Format rating breakdown (5 to 1 stars)
    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingStats.forEach((stat) => {
      ratingBreakdown[stat._id] = stat.count;
    });

    return res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      statistics: {
        averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        ratingBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc Update helpful/not helpful count
const updateHelpfulCount = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isHelpful } = req.body; // true for helpful, false for not helpful

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (typeof isHelpful !== "boolean") {
      return res.status(400).json({ message: "isHelpful must be a boolean" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user already voted
    const hasVotedHelpful = review.helpfulUsers.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
    const hasVotedNotHelpful = review.notHelpfulUsers.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    // If user already voted the same way, remove the vote
    if (isHelpful && hasVotedHelpful) {
      review.helpfulUsers = review.helpfulUsers.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else if (!isHelpful && hasVotedNotHelpful) {
      review.notHelpfulUsers = review.notHelpfulUsers.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
      review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
    } else {
      // User is voting for the first time or changing their vote
      // Remove from opposite list if exists
      if (isHelpful && hasVotedNotHelpful) {
        review.notHelpfulUsers = review.notHelpfulUsers.filter(
          (userId) => userId.toString() !== req.user._id.toString()
        );
        review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
      } else if (!isHelpful && hasVotedHelpful) {
        review.helpfulUsers = review.helpfulUsers.filter(
          (userId) => userId.toString() !== req.user._id.toString()
        );
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      }

      // Add to appropriate list
      if (isHelpful) {
        review.helpfulUsers.push(req.user._id);
        review.helpfulCount += 1;
      } else {
        review.notHelpfulUsers.push(req.user._id);
        review.notHelpfulCount += 1;
      }
    }

    await review.save();

    return res.json({
      message: "Helpful count updated",
      review: {
        _id: review._id,
        helpfulCount: review.helpfulCount,
        notHelpfulCount: review.notHelpfulCount,
      },
    });
  } catch (error) {
    console.error("Error updating helpful count:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc Delete a review (only by the user who created it or admin)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user is the owner or admin
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this review" });
    }

    // Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
      for (const image of review.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (error) {
            console.error(
              "Error deleting review image from Cloudinary:",
              error
            );
            // Continue even if image deletion fails
          }
        }
      }
    }

    await Review.findByIdAndDelete(reviewId);

    return res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  submitReview,
  getProductReviews,
  updateHelpfulCount,
  deleteReview,
};
