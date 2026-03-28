"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const reviewController_1 = require("../controllers/reviewController");
const authMiddleware_1 = require("../middleware/authMiddleware");
// Protected routes
router.get("/me", authMiddleware_1.protect, reviewController_1.getMyReviews);
router.put("/:id", authMiddleware_1.protect, reviewController_1.updateReview);
router.delete("/:id", authMiddleware_1.protect, reviewController_1.deleteReview);
exports.default = router;
