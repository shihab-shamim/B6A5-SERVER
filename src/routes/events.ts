import express from "express";
const router = express.Router();
import {  
  getEvents,
  getFeaturedEvent,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
 } from "../controllers/eventController";
import {  protect  } from "../middleware/authMiddleware";

// Public routes
router.get("/", getEvents);
router.get("/featured", getFeaturedEvent);
router.get("/upcoming", getUpcomingEvents);

// specific protected routes must come before /:id
import {  getPaymentHistory  } from "../controllers/participantController";
router.get("/my-payments", protect, getPaymentHistory);

router.get("/:id", getEventById);

// Protected routes
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

// Participant logic
import {  joinEvent, getEventParticipants, getMyParticipantStatus  } from "../controllers/participantController";
router.post("/:id/join", protect, joinEvent);
router.get("/:id/participants", protect, getEventParticipants);
router.get("/:id/my-status", protect, getMyParticipantStatus);

// Invitation logic
import {  sendInvitation  } from "../controllers/invitationController";
router.post("/:id/invite", protect, sendInvitation);

// Review logic
import {  getEventReviews, createReview  } from "../controllers/reviewController";
router.get("/:id/reviews", getEventReviews);
router.post("/:id/reviews", protect, createReview);

export default router;
