const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { getRazorpayInstance } = require("../services/razorpay");
const Order = require("../models/Order");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  sendOrderConfirmationEmail,
  sendProducerOrderNotificationEmail,
} = require("../services/emailService");
const Product = require("../models/Product");
const User = require("../models/User");

// Create an order on Razorpay
router.post("/create-order", async (req, res) => {
  try {
    const {
      amount,
      currency = "INR",
      receipt = "rcpt_1",
      notes = {},
    } = req.body;

    // Validate env configuration early with a clear message
    if (!process.env.VITE_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: "Razorpay is not configured on the server",
        hint: "Set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your backend .env and restart the server",
      });
    }

    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      return res
        .status(400)
        .json({ message: "amount is required and must be > 0" });
    }
    const instance = getRazorpayInstance();
    const order = await instance.orders.create({
      amount: Math.round(amountNumber),
      currency,
      receipt,
      notes,
    });
    res.json(order);
  } catch (err) {
    console.error("Razorpay create-order error:", err?.message || err);
    res.status(500).json({
      message: "Failed to create order",
      error: err?.message || "Unknown error",
    });
  }
});

// Verify payment signature
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest("hex");

    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) return res.status(400).json({ message: "Invalid signature" });

    res.json({
      message: "Payment verified",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
});

// Public endpoint to get key id for frontend
router.get("/key", (req, res) => {
  if (!process.env.VITE_RAZORPAY_KEY_ID)
    return res.status(500).json({ message: "VITE_RAZORPAY_KEY_ID not set" });
  res.json({ keyId: process.env.VITE_RAZORPAY_KEY_ID });
});

// Confirm payment and create order in DB (authenticated)
router.post(
  "/confirm",
  authenticateToken,
  requireRole(["customer"]),
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        cart,
        address,
        totals,
        currency = "INR",
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing razorpay fields" });
      }

      // Verify signature
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const expectedSignature = hmac.digest("hex");
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid signature" });
      }

      // Basic cart validation
      if (!cart?.items?.length || !totals?.total) {
        return res.status(400).json({ message: "Invalid cart/totals" });
      }

      // Shape address to schema
      const shippingAddress = {
        fullName: address?.fullName,
        phone: address?.phone,
        line1: address?.addressLine1,
        line2: address?.addressLine2 || "",
        city: address?.city,
        state: address?.state,
        postalCode: address?.postalCode,
        country: address?.country || "India",
      };

      const mongoose = require("mongoose");
      const orderItems = cart.items.map((it) => {
        const price = Number(it.price) || 0;
        const quantity = Number(it.quantity) || 1;
        const item = {
          name: it.name,
          price,
          quantity,
          imageUrl: it.image,
        };
        // Only set product if it's a valid ObjectId
        if (it.id && mongoose.Types.ObjectId.isValid(it.id)) {
          item.product = it.id;
        }
        return item;
      });

      // Create order document
      const orderDoc = await Order.create({
        customer: req.user._id,
        items: orderItems,
        subtotal: totals.subtotal || totals.total,
        shipping: totals.shipping || 0,
        total: totals.total,
        status: "paid",
        shippingAddress,
        paymentProvider: "razorpay",
        paymentCurrency: currency,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });

      // Decrease product quantities
      try {
        const productIds = orderItems.map((it) => it.product).filter(Boolean);
        if (productIds.length) {
          // Create a map of quantity to deduct per product
          const quantityByProductId = new Map();
          orderItems.forEach((it) => {
            if (it.product) {
              const productIdStr = String(it.product);
              const currentQty = quantityByProductId.get(productIdStr) || 0;
              quantityByProductId.set(productIdStr, currentQty + (Number(it.quantity) || 1));
            }
          });

          // Decrease quantities for each product
          for (const [productIdStr, qtyToDeduct] of quantityByProductId.entries()) {
            await Product.updateOne(
              { _id: productIdStr },
              { $inc: { quantity: -qtyToDeduct } }
            );
          }
        }
      } catch (e) {
        console.warn("Failed to decrease product quantities:", e?.message || e);
      }

      // Compute commission and seller payout based on base prices (exclude shipping)
      try {
        // For items with product ObjectId, fetch base price from DB
        const productIds = orderItems.map((it) => it.product).filter(Boolean);
        let commissionBase = 0;
        if (productIds.length) {
          const products = await Product.find(
            { _id: { $in: productIds } },
            { _id: 1, price: 1 }
          );
          const priceById = new Map(
            products.map((p) => [String(p._id), Number(p.price) || 0])
          );
          commissionBase = orderItems.reduce((sum, it) => {
            const base = it.product
              ? priceById.get(String(it.product)) || 0
              : it.price; // fallback to item price
            return sum + base * (Number(it.quantity) || 1);
          }, 0);
        } else {
          // Fallback: treat item.price as base (best effort)
          commissionBase = orderItems.reduce(
            (sum, it) =>
              sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
            0
          );
        }

        const adminCommission = Math.round((commissionBase * 5) / 100);
        const sellerPayout = Math.max(commissionBase - adminCommission, 0);
        const agreementText =
          "5% of the original base price (excluding shipping) will be retained by the website owner as admin commission.";

        orderDoc.commissionBase = commissionBase;
        orderDoc.adminCommission = adminCommission;
        orderDoc.sellerPayout = sellerPayout;
        orderDoc.agreement = { text: agreementText, generatedAt: new Date() };
        await orderDoc.save();
      } catch (e) {
        console.warn("Commission computation failed:", e?.message || e);
      }

      // Populate customer for email
      await orderDoc.populate("customer", "email firstName lastName");

      // Fire-and-forget: email confirmation (do not block order response)
      try {
        const customerEmail = orderDoc?.customer?.email || req.user.email;
        if (customerEmail) {
          sendOrderConfirmationEmail(customerEmail, orderDoc);
        }
      } catch (_) {}

      // Send notifications to producers for their products
      try {
        // Get unique producer IDs from order items
        const producerIds = [
          ...new Set(
            orderDoc.items
              .filter((item) => item.product)
              .map((item) => item.product)
          ),
        ];

        if (producerIds.length > 0) {
          // Get product details with producer information
          const products = await Product.find({
            _id: { $in: producerIds },
          }).populate("producer", "email firstName lastName");

          // Group products by producer
          const producerProducts = {};
          products.forEach((product) => {
            const producerId = product.producer._id.toString();
            if (!producerProducts[producerId]) {
              producerProducts[producerId] = {
                producer: product.producer,
                products: [],
              };
            }
            producerProducts[producerId].products.push(product);
          });

          // Send email to each producer
          Object.values(producerProducts).forEach(({ producer, products }) => {
            if (producer.email) {
              // Filter order items for this producer's products
              const producerOrderItems = orderDoc.items.filter((item) =>
                products.some(
                  (p) => p._id.toString() === item.product?.toString()
                )
              );

              const producerOrder = {
                ...orderDoc.toObject(),
                items: producerOrderItems,
              };

              sendProducerOrderNotificationEmail(
                producer.email,
                producerOrder,
                products
              );
            }
          });
        }
      } catch (error) {
        console.error("Error sending producer notifications:", error);
      }

      res.status(201).json({ message: "Order recorded", order: orderDoc });
    } catch (err) {
      console.error("Payment confirm error:", err);
      res
        .status(500)
        .json({ message: "Failed to record order", error: err.message });
    }
  }
);

module.exports = router;
