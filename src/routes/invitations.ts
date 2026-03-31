import express from "express";
const router = express.Router();
import {  getMyInvitations, updateInvitation  } from "../controllers/invitationController";
import {  protect  } from "../middleware/authMiddleware";


router.get("/", protect, getMyInvitations);
router.put("/:id", protect, updateInvitation);

export default router;
