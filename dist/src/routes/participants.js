import express from "express";
const router = express.Router();
import { updateParticipantStatus } from "../controllers/participantController";
import { protect } from "../middleware/authMiddleware";
// Update status (Approve/Reject/Ban)
router.put("/:id", protect, updateParticipantStatus);
export default router;
//# sourceMappingURL=participants.js.map