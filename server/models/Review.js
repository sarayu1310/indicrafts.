const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, required: true }, // Store name for display even if user is deleted
    userEmail: { type: String }, // Store email for reference
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary public_id or S3 key
      },
    ],
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Track users who marked as helpful to prevent duplicate votes
    notHelpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Track users who marked as not helpful
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    }, // Future: mark if user actually purchased the product
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve for now, can add moderation later
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reviews from same user for same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Index for efficient querying by product and rating
reviewSchema.index({ product: 1, rating: 1 });

// Index for sorting by helpful count and date
reviewSchema.index({ product: 1, helpfulCount: -1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
