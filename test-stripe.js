require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripe() {
  console.log("Secret key prefix:", process.env.STRIPE_SECRET_KEY?.substring(0, 10));
  try {
    const list = await stripe.products.list({ limit: 1 });
    console.log("Stripe authenticated successfully:", list.data.length >= 0);
  } catch (error) {
    console.error("Stripe auth error:", error.message);
  }
}

testStripe();
