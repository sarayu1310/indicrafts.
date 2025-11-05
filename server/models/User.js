const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "producer", "admin"],
      default: "customer",
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    phone: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    // Producer data stored in a nested subdocument so customer docs stay lean.
    // Use an explicit sub-schema and set default: undefined so Mongoose doesn't
    // auto-create an empty `producer` object for customers.
    producer: {
      type: new mongoose.Schema(
        {
          businessName: { type: String },
          location: { type: String }, // e.g., "Village, State"
          craftType: { type: String }, // e.g., Pottery, Weaving
          experience: { type: Number }, // legacy field: years of experience
          yearsOfExperience: { type: Number },
          story: { type: String }, // artisan story / description
          productTypes: [{ type: String }], // list of product/craft types
          producerVerified: { type: Boolean, default: false },
          kycDocuments: [{ type: String }], // URLs or filenames for KYC / proof docs
          bankDetails: {
            accountName: { type: String },
            accountNumber: { type: String },
            ifsc: { type: String },
            bankName: { type: String },
            branch: { type: String },
          },
        },
        { _id: false }
      ),
      default: undefined,
    },

    // Customer-related extras (addresses, etc.)
    addresses: [
      {
        label: { type: String },
        addressLine1: { type: String },
        addressLine2: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String, default: "India" },
        phone: { type: String },
      },
    ],
    // Wishlist: Array of product ObjectIds
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
