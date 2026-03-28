import express from "express";
const router = express.Router();
import {  updateReview, deleteReview, getMyReviews  } from "../controllers/reviewController";
import {  protect  } from "../middleware/authMiddleware";

// Protected routes
router.get("/me", protect, getMyReviews);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;
