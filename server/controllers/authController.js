const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");
const { cloudinary } = require("../services/cloudinary");

const JWT_SECRET = process.env.JWT_SECRET || "45ca9f4309621562bc3991c1242c83d8";

// @desc Register new user
const registerUser = async (req, res) => {
  try {
    // Check if req.body exists BEFORE destructuring
    if (!req.body) {
      console.log("req.body is undefined");
      return res.status(400).json({ 
        message: "No request body received. Please ensure Content-Type is set correctly." 
      });
    }

    const body = req.body;

    // Now safely destructure from body
    let {
      firstName,
      lastName,
      email,
      password,
      role = "customer",
      phone,
      // producer-specific
      businessName,
      location,
      craftType,
      experience,
      yearsOfExperience,
      story,
      productTypes,
      // bank details (producer)
      bankAccountName,
      bankAccountNumber,
      bankIfsc,
      bankName,
      bankBranch,
    } = body;

    // Parse productTypes if it's a JSON string (from FormData)
    if (productTypes && typeof productTypes === "string") {
      try {
        productTypes = JSON.parse(productTypes);
      } catch (e) {
        // If parsing fails, treat as single value array
        productTypes = productTypes ? [productTypes] : [];
      }
    }

    // Validation
    if (!firstName || !lastName || !email || !password) {
      console.log("Missing required fields:", { 
        firstName: !!firstName, 
        lastName: !!lastName, 
        email: !!email, 
        password: !!password 
      });
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUserData = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role,
      phone,
      emailVerificationToken,
      emailVerificationExpires,
    };

    // If registering as a producer, attach producer fields and validate required ones
    if (role === "producer") {
      // Minimal validation to match frontend required fields
      if (
        !businessName ||
        !location ||
        !craftType ||
        (experience === undefined && yearsOfExperience === undefined) ||
        !story
      ) {
        return res
          .status(400)
          .json({ message: "All producer fields must be provided" });
      }

      // Validate certificate is required for producer registration
      if (!req.file) {
        console.log("No certificate file provided for producer registration");
        return res
          .status(400)
          .json({
            message: "Certificate file is required for producer registration",
          });
      }

      // Upload certificate to Cloudinary
      let certificateData = null;
      try {
        const uploadFromBuffer = (buffer) =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "indicrafts/certificates",
                resource_type: "auto", // Auto-detect image or PDF
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(buffer);
          });

        const uploadResult = await uploadFromBuffer(req.file.buffer);
        certificateData = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          uploadedAt: new Date(),
        };
      } catch (uploadError) {
        console.error("Certificate upload error:", uploadError);
        return res
          .status(500)
          .json({
            message: "Failed to upload certificate",
            error: uploadError.message,
          });
      }

      // Populate nested producer subdocument
      newUserData.producer = {
        businessName,
        location,
        craftType,
        experience:
          typeof experience === "number"
            ? experience
            : yearsOfExperience
            ? Number(yearsOfExperience)
            : Number(experience),
        yearsOfExperience:
          typeof yearsOfExperience === "number"
            ? yearsOfExperience
            : experience
            ? Number(experience)
            : Number(yearsOfExperience),
        story,
        productTypes:
          Array.isArray(productTypes) && productTypes.length > 0
            ? productTypes
            : craftType
            ? [craftType]
            : [],
        producerVerified: false,
        kycDocuments: [],
        certificate: certificateData,
        bankDetails: {
          accountName: bankAccountName,
          accountNumber: bankAccountNumber,
          ifsc: bankIfsc,
          bankName,
          branch: bankBranch,
        },
      };
    }

    const newUser = new User(newUserData);

    await newUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Login user
const loginUser = async (req, res) => {
  try {
    const { email, password, role: expectedRole } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // If client specifies an expected role (e.g., customer/producer/admin), enforce it strictly
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({ message: "Invalid role for this account" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, passwordResetToken);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return res
        .status(500)
        .json({ message: "Error sending password reset email" });
    }

    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update user profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    if (firstName || lastName) {
      user.name = `${user.firstName} ${user.lastName}`;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user's wishlist (populated with product details)
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "wishlist",
      select:
        "name price description imageUrl category producer producerName producerLocation inStock quantity",
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ wishlist: user.wishlist || [] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Add a product to wishlist
const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!productId)
      return res.status(400).json({ message: "Product ID required" });
    // Add if not already present
    if (!user.wishlist.some((id) => id.toString() === productId)) {
      user.wishlist.push(productId);
      await user.save();
    }
    res.json({ message: "Added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();
    res.json({ message: "Removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
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
};