import express from "express";
const router = express.Router();
import {  createCheckoutSession, webhook, verifyPayment  } from "../controllers/paymentController";
import {  protect  } from "../middleware/authMiddleware";

// Protected route for generating checkout session
router.post("/create-session", protect, createCheckoutSession);
router.post("/verify", protect, verifyPayment);

// Webhook route needs raw body parser, which we'll configure in index.js specifically for this route
// So we export the webhook handler directly or mount it safely
router.post("/webhook", express.raw({ type: "application/json" }), webhook);

export default router;
