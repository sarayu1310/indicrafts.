const Product = require("../models/Product");
const mongoose = require("mongoose");
const { cloudinary } = require("../services/cloudinary");
const shippingService = require("../services/shippingService");
// TODO: MIGRATION TO AWS S3 - Uncomment when ready to switch
// const { uploadImage, deleteImage, generateImageKey } = require("../services/awsS3");

const createProduct = async (req, res) => {
  try {
    // Read fields from form; use `let` because we may parse `location` if it's a JSON string
    let {
      name,
      description,
      price,
      category,
      quantity,
      producerLocation,
      weight,
      location,
    } = req.body;

    // If the request was multipart/form-data, `location` may arrive as a JSON string — parse it.
    if (location && typeof location === "string") {
      try {
        location = JSON.parse(location);
      } catch (e) {
        console.warn("Failed to parse location JSON from form data");
      }
    }
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // TODO: MIGRATION TO AWS S3
    // Current implementation uses Cloudinary (temporary)
    // Future implementation will use AWS S3:
    /*
    const productId = new mongoose.Types.ObjectId();
    const imageKey = generateImageKey(req.file.originalname, productId.toString());
    const uploadResult = await uploadImage(req.file.buffer, imageKey, req.file.mimetype);
    
    const product = await Product.create({
      name,
      description,
      price,
      category,
      quantity: quantity ? Number(quantity) : 0,
      imageUrl: uploadResult.url,
      imagePublicId: uploadResult.key, // Store S3 key instead of Cloudinary public_id
      producer: req.user._id,
      producerName: req.user.firstName || req.user.name || "",
      producerLocation: producerLocation || "",
    });
    */

    // CURRENT CLOUDINARY IMPLEMENTATION (TEMPORARY)
    const uploadFromBuffer = (buffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "indicrafts/products", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });

    const uploadResult = await uploadFromBuffer(req.file.buffer);

    const product = await Product.create({
      name,
      description,
      price,
      category,
      quantity: quantity ? Number(quantity) : 0,
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      producer: req.user._id,
      producerName: req.user.firstName || req.user.name || "",
      producerLocation: producerLocation || "",
      weight: weight ? Number(weight) : undefined,
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            city: location.city,
            state: location.state,
            country: location.country,
            postalCode: location.postalCode,
          }
        : undefined,
    });

    // Compute authoritative shipping and pricing breakdown (includes weight)
    try {
      const shippingCost = shippingService.getProductShippingCost(product);
      const totalPriceObj = shippingService.calculateTotalPrice(
        product.price,
        product
      );
      const commission = Number((product.price * 0.05).toFixed(2));
      const sellerPayout = Number((product.price - commission).toFixed(2));
      const customerPrice = totalPriceObj.totalPrice;

      // Update product with calculated values
      product.customerPrice = customerPrice;
      product.adminCommission = commission;
      product.shippingCost = shippingCost.totalCost || 0;
      await product.save();

      const productForResponse = {
        ...product.toObject(),
        // Customer-facing price is base + shipping (producer -> IIT KGP)
        price: totalPriceObj.totalPrice,
        originalPrice: product.price,
        shippingCost: shippingCost.totalCost,
        totalPrice: totalPriceObj.totalPrice,
        priceBreakdown: {
          basePrice: product.price,
          weight: product.weight,
          shippingCost: shippingCost.totalCost,
          shippingDetails: shippingCost,
          commission,
          sellerPayout,
          totalPrice: totalPriceObj.totalPrice,
        },
      };

      return res
        .status(201)
        .json({ message: "Product created", product: productForResponse });
    } catch (e) {
      // Fallback: return product without breakdown if shipping calc fails
      return res.status(201).json({ message: "Product created", product });
    }
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const listProducts = async (_req, res) => {
  try {
    const products = await Product.find({ isApproved: true }).sort({
      createdAt: -1,
    });

    // For customer view, show producer price + shipping to IIT KGP
    const shippingService = require("../services/shippingService");
    const productsForCustomer = products.map((product) => {
      const shippingCost = shippingService.getProductShippingCost(product);
      const totalPrice = shippingService.calculateTotalPrice(
        product.price,
        product
      );

      return {
        ...product.toObject(),
        // Show total price (producer price + shipping to IIT KGP) to customers
        price: totalPrice.totalPrice,
        originalPrice: product.price, // Keep original price for reference
        shippingCost: shippingCost.totalCost,
        totalPrice: totalPrice.totalPrice,
        priceBreakdown: {
          basePrice: product.price,
          shippingCost: shippingCost.totalCost,
          totalPrice: totalPrice.totalPrice,
          shippingDetails: shippingCost,
        },
      };
    });

    return res.json({ message: "OK", products: productsForCustomer });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by slug first (URL-friendly), then fallback to MongoDB ID
    let product = await Product.findOne({ slug: id });
    
    // If not found by slug, try MongoDB ID (backward compatibility)
    if (!product && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    
    if (!product) return res.status(404).json({ message: "Product not found" });
    // If not approved, only allow producer or admin to view
    if (!product.isApproved) {
      const isAuthenticated = Boolean(req.user);
      const isOwner =
        isAuthenticated && String(product.producer) === String(req.user._id);
      const isAdmin = isAuthenticated && req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    // For customer view, show producer price + shipping to IIT KGP
    const shippingService = require("../services/shippingService");
    const shippingCost = shippingService.getProductShippingCost(product);
    const totalPrice = shippingService.calculateTotalPrice(
      product.price,
      product
    );

    const productForCustomer = {
      ...product.toObject(),
      // Show total price (producer price + shipping to IIT KGP) to customers
      price: totalPrice.totalPrice,
      originalPrice: product.price, // Keep original price for reference
      shippingCost: shippingCost.totalCost,
      totalPrice: totalPrice.totalPrice,
      priceBreakdown: {
        basePrice: product.price,
        shippingCost: shippingCost.totalCost,
        totalPrice: totalPrice.totalPrice,
        shippingDetails: shippingCost,
      },
    };

    return res.json({ message: "OK", product: productForCustomer });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const listMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ producer: req.user._id }).sort({
      createdAt: -1,
    });

    // Include server-side computed price breakdown for producer view so producer
    // sees the same composition (base + weight shipping + distance surcharge + commission)
    const productsWithBreakdown = products.map((product) => {
      try {
        const shippingCost = shippingService.getProductShippingCost(product);
        const totalObj = shippingService.calculateTotalPrice(
          product.price,
          product
        );
        const commission = Number((product.price * 0.05).toFixed(2));
        const sellerPayout = Number((product.price - commission).toFixed(2));

        return {
          ...product.toObject(),
          priceBreakdown: product.approvedPriceBreakdown || {
            basePrice: product.price,
            weight: product.weight,
            shippingCost: shippingCost.totalCost,
            shippingDetails: shippingCost,
            commission,
            sellerPayout,
            totalPrice: totalObj.totalPrice,
          },
        };
      } catch (e) {
        return {
          ...product.toObject(),
        };
      }
    });

    return res.json({ message: "OK", products: productsWithBreakdown });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      producer: req.user._id,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Use `let` so we can parse `location` if it's a JSON string (multipart/form-data)
    let {
      name,
      description,
      price,
      category,
      quantity,
      producerLocation,
      weight,
      location,
    } = req.body;

    if (location && typeof location === "string") {
      try {
        location = JSON.parse(location);
      } catch (e) {
        console.warn("Failed to parse location JSON in updateProduct");
      }
    }

    // TODO: MIGRATION TO AWS S3
    // Current implementation uses Cloudinary (temporary)
    // Future implementation will use AWS S3:
    /*
    if (req.file) {
      // Delete old image from S3
      if (product.imagePublicId) {
        try {
          await deleteImage(product.imagePublicId);
        } catch (_) {}
      }
      
      // Upload new image to S3
      const imageKey = generateImageKey(req.file.originalname, product._id.toString());
      const uploadResult = await uploadImage(req.file.buffer, imageKey, req.file.mimetype);
      product.imageUrl = uploadResult.url;
      product.imagePublicId = uploadResult.key;
    }
    */

    // CURRENT CLOUDINARY IMPLEMENTATION (TEMPORARY)
    if (req.file) {
      if (product.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(product.imagePublicId);
        } catch (_) {}
      }
      const uploadFromBuffer = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "indicrafts/products", resource_type: "image" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(buffer);
        });
      const uploadResult = await uploadFromBuffer(req.file.buffer);
      product.imageUrl = uploadResult.secure_url;
      product.imagePublicId = uploadResult.public_id;
    }

    const hasContentChange =
      name !== undefined ||
      description !== undefined ||
      price !== undefined ||
      category !== undefined ||
      quantity !== undefined ||
      producerLocation !== undefined ||
      weight !== undefined ||
      location !== undefined ||
      Boolean(req.file);

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (quantity !== undefined) product.quantity = quantity;
    if (producerLocation !== undefined)
      product.producerLocation = producerLocation;
    if (weight !== undefined)
      product.weight = weight ? Number(weight) : undefined;
    if (location !== undefined) {
      // location may be an object (parsed) or null/undefined
      if (location) {
        product.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country,
          postalCode: location.postalCode,
        };
      } else {
        product.location = undefined;
      }
    }

    // Any producer edits reset approval
    if (hasContentChange) {
      product.isApproved = false;
      product.approvalStatus = "pending";
      product.approvalNotes = undefined;
      product.approvedAt = undefined;
      product.approvedBy = undefined;
    }

    // Calculate and update pricing fields before saving
    try {
      const shippingCost = shippingService.getProductShippingCost(product);
      const totalPriceObj = shippingService.calculateTotalPrice(
        product.price,
        product
      );
      const commission = Number((product.price * 0.05).toFixed(2));
      const customerPrice = totalPriceObj.totalPrice;

      // Update product with calculated values
      product.customerPrice = customerPrice;
      product.adminCommission = commission;
      product.shippingCost = shippingCost.totalCost || 0;
    } catch (e) {
      console.warn("Failed to calculate pricing fields:", e?.message || e);
    }

    await product.save();
    // Return server-computed breakdown for producer to see exact composition
    try {
      const shippingCost = shippingService.getProductShippingCost(product);
      const totalPriceObj = shippingService.calculateTotalPrice(
        product.price,
        product
      );
      const commission = Number((product.price * 0.05).toFixed(2));
      const sellerPayout = Number((product.price - commission).toFixed(2));

      const productForResponse = {
        ...product.toObject(),
        price: totalPriceObj.totalPrice,
        originalPrice: product.price,
        shippingCost: shippingCost.totalCost,
        totalPrice: totalPriceObj.totalPrice,
        priceBreakdown: product.approvedPriceBreakdown || {
          basePrice: product.price,
          weight: product.weight,
          shippingCost: shippingCost.totalCost,
          shippingDetails: shippingCost,
          commission,
          sellerPayout,
          totalPrice: totalPriceObj.totalPrice,
        },
      };

      return res.json({
        message: "Product updated",
        product: productForResponse,
      });
    } catch (e) {
      return res.json({ message: "Product updated", product });
    }
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      producer: req.user._id,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // TODO: MIGRATION TO AWS S3
    // Current implementation uses Cloudinary (temporary)
    // Future implementation will use AWS S3:
    /*
    if (product.imagePublicId) {
      try {
        await deleteImage(product.imagePublicId);
      } catch (_) {}
    }
    */

    // CURRENT CLOUDINARY IMPLEMENTATION (TEMPORARY)
    if (product.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(product.imagePublicId);
      } catch (_) {}
    }

    await product.deleteOne();
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getProducerStats = async (req, res) => {
  try {
    const Order = require("../models/Order");
    const producerId = req.user._id;

    // Get all products for this producer
    const products = await Product.find({ producer: producerId });
    const productIds = products.map((p) => p._id);

    // Create a map of products for quick lookup
    const productById = new Map(products.map((p) => [String(p._id), p]));

    // Calculate stats from orders
    const orders = await Order.find({
      items: { $elemMatch: { product: { $in: productIds } } },
      status: { $in: ["paid", "shipped", "delivered"] },
    });

    // Calculate metrics using product's stored fields
    let totalSales = 0;
    let totalRevenue = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          item.product &&
          productIds.some((id) => id.toString() === item.product.toString())
        ) {
          totalSales += item.quantity || 1;
          // Calculate producer revenue: (customer price - admin commission) * quantity
          // Use stored fields from product
          const product = productById.get(String(item.product));
          const customerPrice =
            Number(product?.customerPrice || item.price) || 0;
          const adminCommission = Number(product?.adminCommission || 0);
          const producerRevenue = customerPrice - adminCommission;
          totalRevenue += producerRevenue * (item.quantity || 1);
        }
      });
    });

    const stats = {
      totalProducts: products.length,
      totalViews: 0,
      totalSales: totalSales,
      revenue: totalRevenue,
    };

    return res.json({ stats });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  listMyProducts,
  updateProduct,
  deleteProduct,
  getProducerStats,
};
