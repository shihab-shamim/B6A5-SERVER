"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const eventController_1 = require("../controllers/eventController");
const authMiddleware_1 = require("../middleware/authMiddleware");
// Public routes
router.get("/", eventController_1.getEvents);
router.get("/featured", eventController_1.getFeaturedEvent);
router.get("/upcoming", eventController_1.getUpcomingEvents);
// specific protected routes must come before /:id
const participantController_1 = require("../controllers/participantController");
router.get("/my-payments", authMiddleware_1.protect, participantController_1.getPaymentHistory);
router.get("/:id", eventController_1.getEventById);
// Protected routes
router.post("/", authMiddleware_1.protect, eventController_1.createEvent);
router.put("/:id", authMiddleware_1.protect, eventController_1.updateEvent);
router.delete("/:id", authMiddleware_1.protect, eventController_1.deleteEvent);
// Participant logic
const participantController_2 = require("../controllers/participantController");
router.post("/:id/join", authMiddleware_1.protect, participantController_2.joinEvent);
router.get("/:id/participants", authMiddleware_1.protect, participantController_2.getEventParticipants);
router.get("/:id/my-status", authMiddleware_1.protect, participantController_2.getMyParticipantStatus);
// Invitation logic
const invitationController_1 = require("../controllers/invitationController");
router.post("/:id/invite", authMiddleware_1.protect, invitationController_1.sendInvitation);
// Review logic
const reviewController_1 = require("../controllers/reviewController");
router.get("/:id/reviews", reviewController_1.getEventReviews);
router.post("/:id/reviews", authMiddleware_1.protect, reviewController_1.createReview);
exports.default = router;
