const Razorpay = require("razorpay");

function getRazorpayInstance() {
  const keyId = process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing VITE_RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET in environment"
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

module.exports = { getRazorpayInstance };
