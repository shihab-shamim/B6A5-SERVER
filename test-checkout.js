require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testCheckout() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) return console.log("No admin found");
  
  const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  console.log("Token generated.");

  const event = await prisma.event.findFirst({ where: { isFree: false } });
  if (!event) return console.log("No paid events found");

  const response = await fetch("http://localhost:5000/api/payments/create-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ eventId: event.id })
  });
  
  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", data);
}

testCheckout().catch(console.error).finally(() => prisma.$disconnect());
