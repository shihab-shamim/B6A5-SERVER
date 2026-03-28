"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const invitationController_1 = require("../controllers/invitationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
// Protected routes
router.get("/", authMiddleware_1.protect, invitationController_1.getMyInvitations);
router.put("/:id", authMiddleware_1.protect, invitationController_1.updateInvitation);
exports.default = router;
