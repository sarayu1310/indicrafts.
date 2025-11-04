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
    // Development log
    console.log("📧 Order Confirmation (Development Mode):");
    console.log(`To: ${email}`);
    console.log(`Order: ${order?._id}`);

    let transporter;
    try {
      transporter = createTransporter();
    } catch (err) {
      console.warn("Email transporter not configured:", err.message);
      return;
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
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
};
// Send email verification
const sendVerificationEmail = async (email, token) => {
  try {
    // For development/testing - just log the verification URL
    const frontendBase = process.env.FRONTEND_URL || "https://indicrafts-ixaj.onrender.com/";
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
    const frontendBase = process.env.FRONTEND_URL || "https://indicrafts-ixaj.onrender.com/";
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
    // Development log
    console.log("📧 Producer Order Notification (Development Mode):");
    console.log(`To: ${producerEmail}`);
    console.log(`Order: ${order?._id}`);

    let transporter;
    try {
      transporter = createTransporter();
    } catch (err) {
      console.warn("Email transporter not configured:", err.message);
      return;
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
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending producer order notification email:", error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendProducerOrderNotificationEmail,
};
