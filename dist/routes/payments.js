"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const paymentController_1 = require("../controllers/paymentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
// Protected route for generating checkout session
router.post("/create-session", authMiddleware_1.protect, paymentController_1.createCheckoutSession);
router.post("/verify", authMiddleware_1.protect, paymentController_1.verifyPayment);
// Webhook route needs raw body parser, which we'll configure in index.js specifically for this route
// So we export the webhook handler directly or mount it safely
router.post("/webhook", express_1.default.raw({ type: "application/json" }), paymentController_1.webhook);
exports.default = router;
