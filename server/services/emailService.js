const nodemailer = require("nodemailer");

// Create transporter (uses EMAIL_HOST/EMAIL_PORT if provided, otherwise falls back to Gmail service)
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS must be set in environment to send emails"
    );
  }

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT
    ? parseInt(process.env.EMAIL_PORT, 10)
    : undefined;

  const auth = { user, pass };

  const transporterOptions = host
    ? {
        host,
        port,
        secure: port === 465, // true for 465, false for 587
        auth,
      }
    : {
        service: "gmail",
        auth,
      };

  return nodemailer.createTransport(transporterOptions);
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, order) => {
  try {
    // Validate email address
    if (!email || !email.includes("@")) {
      console.error("Invalid email address for order confirmation:", email);
      return;
    }

    console.log("📧 Sending Order Confirmation Email:");
    console.log(`To: ${email}`);
    console.log(`Order ID: ${order?._id}`);

    let transporter;
    try {
      transporter = createTransporter();
    } catch (err) {
      console.error("Email transporter not configured:", err.message);
      console.error(
        "Please set EMAIL_USER and EMAIL_PASS in environment variables"
      );
      throw err; // Re-throw to be caught by caller
    }

    const orderRows = (order.items || [])
      .map(
        (it) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${
              it.name
            }</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${
              it.quantity
            }</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee; text-align:right;">₹${(
              it.price * it.quantity
            ).toLocaleString()}</td>
          </tr>`
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your IndiCrafts Order ${order._id} is Confirmed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="padding: 16px 0; text-align: center;">
            <h2 style="margin: 0; color: #C45527;">Thank you for your purchase!</h2>
            <p style="margin: 6px 0 0; color: #555;">Order ID: <strong>${
              order._id
            }</strong></p>
            <p style="margin: 0; color: #555;">Payment ID: <strong>${
              order.razorpayPaymentId || "-"
            }</strong></p>
          </div>
          <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
            <thead>
              <tr style="background:#fafafa;">
                <th style="text-align:left; padding:8px 12px; border-bottom:1px solid #eee;">Item</th>
                <th style="text-align:left; padding:8px 12px; border-bottom:1px solid #eee;">Qty</th>
                <th style="text-align:right; padding:8px 12px; border-bottom:1px solid #eee;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:8px 12px; text-align:right;">Subtotal</td>
                <td style="padding:8px 12px; text-align:right;">₹${Number(
                  order.subtotal
                ).toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:8px 12px; text-align:right;">Shipping</td>
                <td style="padding:8px 12px; text-align:right;">₹${Number(
                  order.shipping || 0
                ).toLocaleString()}</td>
              </tr>
              ${
                order.totals?.weightRate
                  ? `
              <tr>
                <td colspan="2" style="padding:8px 12px; text-align:right;">Weight Rate</td>
                <td style="padding:8px 12px; text-align:right;">₹${Number(
                  order.totals.weightRate || 0
                ).toLocaleString()}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td colspan="2" style="padding:8px 12px; text-align:right; font-weight:bold;">Total</td>
                <td style="padding:8px 12px; text-align:right; font-weight:bold;">₹${Number(
                  order.total
                ).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 16px; color: #555;">
            <p style="margin: 0 0 6px;">Shipping to:</p>
            <div>
              ${order.shippingAddress?.fullName || ""}<br/>
              ${order.shippingAddress?.phone || ""}<br/>
              ${order.shippingAddress?.line1 || ""}${
        order.shippingAddress?.line2 ? ", " + order.shippingAddress.line2 : ""
      }<br/>
              ${order.shippingAddress?.city || ""}, ${
        order.shippingAddress?.state || ""
      } ${order.shippingAddress?.postalCode || ""}<br/>
              ${order.shippingAddress?.country || ""}
            </div>
          </div>

          <p style="margin-top: 20px; color:#666; font-size: 12px;">If you have any questions, reply to this email or contact support.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Order confirmation email sent successfully:");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${email}`);
    console.log(`   Order: ${order?._id}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending order confirmation email:");
    console.error(`   To: ${email}`);
    console.error(`   Order: ${order?._id}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    // Re-throw so caller can handle it
    throw error;
  }
};
// Send email verification
const sendVerificationEmail = async (email, token) => {
  try {
    // For development/testing - just log the verification URL
    const frontendBase =
      process.env.FRONTEND_URL || "https://indicrafts.netlify.app";
    const verificationUrl = `${frontendBase}/verify-email?token=${token}`;
    console.log("📧 Verification Email (Development Mode):");
    console.log(`To: ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log("In production, this would send an actual email.");
    // Try to send the email if credentials are present. Keep development-friendly logging.
    let transporter;
    try {
      transporter = createTransporter();
    } catch (err) {
      // Missing credentials — we already logged the URL above. Do not throw here to avoid failing registration.
      console.warn("Email transporter not configured:", err.message);
      return;
    }
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your IndiCrafts Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d2691e;">Welcome to IndiCrafts!</h2>
          <p>Thank you for registering with IndiCrafts. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #d2691e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  try {
    // For development/testing - just log the reset URL
    const frontendBase =
      process.env.FRONTEND_URL || "https://indicrafts.netlify.app";
    const resetUrl = `${frontendBase}/reset-password?token=${token}`;
    console.log("📧 Password Reset Email (Development Mode):");
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("In production, this would send an actual email.");

    // Try to create transporter if email credentials are present
    let transporter;
    try {
      transporter = createTransporter();
    } catch (err) {
      console.warn("Email transporter not configured:", err.message);
      return;
    }
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your IndiCrafts Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d2691e;">Password Reset Request</h2>
          <p>You requested to reset your password for your IndiCrafts account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #d2691e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

// Send order notification email to producer
const sendProducerOrderNotificationEmail = async (
  producerEmail,
  order,
  productDetails
) => {
  try {
    // Validate email address
    if (!producerEmail || !producerEmail.includes("@")) {
      console.error(
        "Invalid email address for producer notification:",
        producerEmail
      );
      return;
    }

    console.log("📧 Sending Producer Order Notification Email:");
    console.log(`To: ${producerEmail}`);
    console.log(`Order ID: ${order?._id}`);

    let transporter;
    try {
      transporter = createTransporter();
    } catch (err) {
      console.error("Email transporter not configured:", err.message);
      console.error(
        "Please set EMAIL_USER and EMAIL_PASS in environment variables"
      );
      throw err; // Re-throw to be caught by caller
    }

    const orderRows = (order.items || [])
      .map(
        (it) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${it.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${it.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">IIT-KGP Hub</td>
          </tr>`
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: producerEmail,
      subject: `New Order Received - IndiCrafts Order ${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="padding: 16px 0; text-align: center;">
            <h2 style="margin: 0; color: #C45527;">New Order Received!</h2>
            <p style="margin: 6px 0 0; color: #555;">Order ID: <strong>${
              order._id
            }</strong></p>
            <p style="margin: 0; color: #555;">Payment ID: <strong>${
              order.razorpayPaymentId || "-"
            }</strong></p>
          </div>
          
          <div style="margin: 16px 0; padding: 12px; background-color: #f8f9fa; border-radius: 4px;">
            <h3 style="margin: 0 0 8px; color: #333;">Customer Information</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${
              order.customer?.firstName || ""
            } ${order.customer?.lastName || ""}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${
              order.customer?.email || ""
            }</p>
            <p style="margin: 4px 0;"><strong>Address:</strong></p>
            <div style="margin: 4px 0 0 20px; color: #555;">
              ${order.shippingAddress?.fullName || ""}<br/>
              ${order.shippingAddress?.phone || ""}<br/>
              ${order.shippingAddress?.line1 || ""}${
        order.shippingAddress?.line2 ? ", " + order.shippingAddress.line2 : ""
      }<br/>
              ${order.shippingAddress?.city || ""}, ${
        order.shippingAddress?.state || ""
      } ${order.shippingAddress?.postalCode || ""}<br/>
              ${order.shippingAddress?.country || ""}
            </div>
          </div>

          <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
            <thead>
              <tr style="background:#fafafa;">
                <th style="text-align:left; padding:8px 12px; border-bottom:1px solid #eee;">Product</th>
                <th style="text-align:left; padding:8px 12px; border-bottom:1px solid #eee;">Qty</th>
                <th style="text-align:left; padding:8px 12px; border-bottom:1px solid #eee;">Ship To</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows}
            </tbody>
          </table>

          <div style="margin-top: 16px; color: #555;">
            <h3 style="margin: 0 0 8px; color: #333;">Shipping Address</h3>
            <div>
              IIT-KGP Hub<br/>
              Indian Institute of Technology Kharagpur<br/>
              Kharagpur, West Bengal<br/>
              721302<br/>
              India
            </div>
          </div>

          <div style="margin-top: 20px; padding: 12px; background-color: #e8f5e8; border-radius: 4px;">
            <p style="margin: 0; color: #2d5a2d; font-weight: bold; font-size: 16px;">Please ship the products to the IIT KGP Hub as early as possible</p>
            <ul style="margin: 8px 0 0; padding-left: 20px; color: #2d5a2d;">
              <li>Review the order details</li>
              <li>Prepare the products for shipping</li>
              <li>Update order status in your producer dashboard</li>
              <li>Contact customer if needed</li>
            </ul>
          </div>

          <p style="margin-top: 20px; color:#666; font-size: 12px;">Please log in to your producer dashboard to manage this order.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Producer order notification email sent successfully:");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${producerEmail}`);
    console.log(`   Order: ${order?._id}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending producer order notification email:");
    console.error(`   To: ${producerEmail}`);
    console.error(`   Order: ${order?._id}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    // Re-throw so caller can handle it
    throw error;
  }
};

// Send admin notification email with order and producer details
const sendAdminOrderNotificationEmail = async (
  order,
  productsWithProducers
) => {
  try {
    // Development log
    console.log("📧 Admin Order Notification (Development Mode):");
    console.log(`To: ${process.env.EMAIL_USER}`);
    console.log(`Order: ${order?._id}`);

    let transporter;
    try {
      transporter = createTransporter();
    } catch (err) {
      console.warn("Email transporter not configured:", err.message);
      return;
    }

    // Create a map of product ID to producer info for quick lookup
    const productToProducer = new Map();
    productsWithProducers.forEach((product) => {
      if (product._id && product.producer) {
        const producer = product.producer;
        const producerName =
          producer.name ||
          (producer.firstName
            ? `${producer.firstName} ${producer.lastName || ""}`.trim()
            : "");
        const producerSubdoc = producer.producer || {};

        productToProducer.set(String(product._id), {
          name: producerName || producerSubdoc.businessName || "N/A",
          email: producer.email || "",
          location: product.producerLocation || producerSubdoc.location || "",
          businessName: producerSubdoc.businessName || producerName || "",
        });
      }
    });

    // Build order items table with producer info
    const orderRows = (order.items || [])
      .map((it) => {
        const producerInfo = it.product
          ? productToProducer.get(String(it.product))
          : null;
        const producerName =
          producerInfo?.name || producerInfo?.businessName || "N/A";
        const producerEmail = producerInfo?.email || "N/A";
        const producerLocation = producerInfo?.location || "N/A";

        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${
              it.name || "N/A"
            }</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee; text-align:center;">${
              it.quantity || 0
            }</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee; text-align:right;">₹${(
              Number(it.price || 0) * Number(it.quantity || 0)
            ).toLocaleString()}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${producerName}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${producerEmail}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${producerLocation}</td>
          </tr>`;
      })
      .join("");

    // Build unique producers table
    const uniqueProducers = Array.from(productToProducer.values());
    const producerRows = uniqueProducers
      .map((producer) => {
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${
              producer.businessName || producer.name || "N/A"
            }</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${
              producer.name || "N/A"
            }</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${
              producer.email || "N/A"
            }</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${
              producer.location || "N/A"
            }</td>
          </tr>`;
      })
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Order Placed – Order Summary & Producer Details`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="padding: 16px 0; text-align: center; background-color: #C45527; color: white; border-radius: 4px 4px 0 0;">
            <h2 style="margin: 0; color: white;">New Order Placed</h2>
            <p style="margin: 6px 0 0; color: white;">Order ID: <strong>${
              order._id || "N/A"
            }</strong></p>
            <p style="margin: 0; color: white;">Payment ID: <strong>${
              order.razorpayPaymentId || "-"
            }</strong></p>
            <p style="margin: 4px 0 0; color: white;">Date: <strong>${new Date(
              order.createdAt || Date.now()
            ).toLocaleString()}</strong></p>
          </div>

          <div style="padding: 16px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-top: none;">
            <h3 style="margin: 0 0 12px; color: #333;">Customer Information</h3>
            <table style="width:100%; border-collapse: collapse;">
              <tr>
                <td style="padding:4px 8px; font-weight:bold; width:120px;">Name:</td>
                <td style="padding:4px 8px;">${
                  order.customer?.firstName || ""
                } ${order.customer?.lastName || ""}</td>
              </tr>
              <tr>
                <td style="padding:4px 8px; font-weight:bold;">Email:</td>
                <td style="padding:4px 8px;">${
                  order.customer?.email || "N/A"
                }</td>
              </tr>
              <tr>
                <td style="padding:4px 8px; font-weight:bold;">Phone:</td>
                <td style="padding:4px 8px;">${
                  order.shippingAddress?.phone || "N/A"
                }</td>
              </tr>
              <tr>
                <td style="padding:4px 8px; font-weight:bold; vertical-align:top;">Shipping Address:</td>
                <td style="padding:4px 8px;">
                  ${order.shippingAddress?.fullName || ""}<br/>
                  ${order.shippingAddress?.line1 || ""}${
        order.shippingAddress?.line2 ? ", " + order.shippingAddress.line2 : ""
      }<br/>
                  ${order.shippingAddress?.city || ""}, ${
        order.shippingAddress?.state || ""
      } ${order.shippingAddress?.postalCode || ""}<br/>
                  ${order.shippingAddress?.country || ""}
                </td>
              </tr>
            </table>
          </div>

          <div style="padding: 16px; border: 1px solid #dee2e6; border-top: none;">
            <h3 style="margin: 0 0 12px; color: #333;">Order Items & Producer Details</h3>
            <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background:#fafafa;">
                  <th style="text-align:left; padding:8px 12px; border-bottom:2px solid #dee2e6;">Product</th>
                  <th style="text-align:center; padding:8px 12px; border-bottom:2px solid #dee2e6;">Qty</th>
                  <th style="text-align:right; padding:8px 12px; border-bottom:2px solid #dee2e6;">Amount</th>
                  <th style="text-align:left; padding:8px 12px; border-bottom:2px solid #dee2e6;">Producer Name</th>
                  <th style="text-align:left; padding:8px 12px; border-bottom:2px solid #dee2e6;">Producer Email</th>
                  <th style="text-align:left; padding:8px 12px; border-bottom:2px solid #dee2e6;">Producer Location</th>
                </tr>
              </thead>
              <tbody>
                ${orderRows}
              </tbody>
            </table>
          </div>

          <div style="padding: 16px; border: 1px solid #dee2e6; border-top: none; background-color: #f8f9fa;">
            <h3 style="margin: 0 0 12px; color: #333;">Order Summary</h3>
            <table style="width:100%; border-collapse: collapse;">
              <tr>
                <td style="padding:8px 12px; text-align:right; font-weight:bold;">Subtotal:</td>
                <td style="padding:8px 12px; text-align:right;">₹${Number(
                  order.subtotal || 0
                ).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; text-align:right; font-weight:bold;">Shipping:</td>
                <td style="padding:8px 12px; text-align:right;">₹${Number(
                  order.shipping || 0
                ).toLocaleString()}</td>
              </tr>
              ${
                order.totals?.weightRate
                  ? `
              <tr>
                <td style="padding:8px 12px; text-align:right; font-weight:bold;">Weight Rate:</td>
                <td style="padding:8px 12px; text-align:right;">₹${Number(
                  order.totals.weightRate || 0
                ).toLocaleString()}</td>
              </tr>
              `
                  : ""
              }
              <tr style="border-top:2px solid #dee2e6;">
                <td style="padding:8px 12px; text-align:right; font-weight:bold; font-size:16px;">Total:</td>
                <td style="padding:8px 12px; text-align:right; font-weight:bold; font-size:16px; color:#C45527;">₹${Number(
                  order.total || 0
                ).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          ${
            uniqueProducers.length > 0
              ? `
          <div style="padding: 16px; border: 1px solid #dee2e6; border-top: none;">
            <h3 style="margin: 0 0 12px; color: #333;">Producer Information Summary</h3>
            <table style="width:100%; border-collapse: collapse;">
              <thead>
                <tr style="background:#fafafa;">
                  <th style="text-align:left; padding:8px 12px; border-bottom:2px solid #dee2e6;">Business Name</th>
                  <th style="text-align:left; padding:8px 12px; border-bottom:2px solid #dee2e6;">Producer Name</th>
                  <th style="text-align:left; padding:8px 12px; border-bottom:2px solid #dee2e6;">Email</th>
                  <th style="text-align:left; padding:8px 12px; border-bottom:2px solid #dee2e6;">Location</th>
                </tr>
              </thead>
              <tbody>
                ${producerRows}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          <div style="padding: 16px; border: 1px solid #dee2e6; border-top: none; background-color: #e8f5e8; border-radius: 0 0 4px 4px;">
            <p style="margin: 0; color: #2d5a2d; font-size: 14px;">
              <strong>Note:</strong> This is an automated notification. Please review the order details and ensure proper coordination with producers.
            </p>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending admin order notification email:", error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendProducerOrderNotificationEmail,
  sendAdminOrderNotificationEmail,
};
