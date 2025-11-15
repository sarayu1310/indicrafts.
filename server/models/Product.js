const mongoose = require("mongoose");

// Helper function to generate URL-friendly slug from product name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values but enforce uniqueness when present
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // Base price (producer price)
    customerPrice: { type: Number, min: 0 }, // Customer price (base + shipping)
    adminCommission: { type: Number, default: 0, min: 0 }, // Admin commission (5% of base price)
    shippingCost: { type: Number, default: 0, min: 0 }, // Shipping cost
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, default: 0, min: 0 },
    producer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    producerName: { type: String },
    producerLocation: { type: String },
    weight: { type: Number, min: 0 }, // Weight in grams
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    // Moderation fields
    isApproved: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvalNotes: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Persisted approved pricing snapshot (set by admin on approval)
    approvedFinalPrice: { type: Number },
    approvedPriceBreakdown: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate slug from name if not provided
productSchema.pre("save", async function (next) {
  if ((this.isModified("name") || !this.slug) && this.name) {
    let baseSlug = generateSlug(this.name);

    // If slug already exists, append a number to make it unique
    const Product = this.constructor;
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await Product.findOne({
        slug: finalSlug,
        _id: { $ne: this._id },
      });

      if (!existing) {
        break;
      }

      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = finalSlug;
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
