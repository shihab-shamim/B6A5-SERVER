import express from "express";
const router = express.Router();
import {  getUsers, deleteUser, getAllEventsAdmin  } from "../controllers/adminController";
import {  protect, admin  } from "../middleware/authMiddleware";

// All admin routes must be protected and restricted to admin
router.use(protect, admin);

router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.get("/events", getAllEventsAdmin);
// Note: delete event by admin is handled in eventController.js (`DELETE /api/events/:id`)

export default router;
