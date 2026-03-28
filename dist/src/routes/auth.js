import express from "express";
const router = express.Router();
import { registerUser, loginUser, getMe, updateProfile } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
export default router;
//# sourceMappingURL=auth.js.map