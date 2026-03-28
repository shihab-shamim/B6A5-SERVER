require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStripe() {
  const sessions = await stripe.checkout.sessions.list({ limit: 5 });
  console.log("Recent sessions:", sessions.data.map(s => ({
    id: s.id,
    client_reference_id: s.client_reference_id,
    payment_status: s.payment_status,
    metadata: s.metadata,
    amount_total: s.amount_total,
    payment_intent: s.payment_intent
  })));
}

testStripe().catch(console.error).finally(() => prisma.$disconnect());
