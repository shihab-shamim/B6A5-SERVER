"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const participantController_1 = require("../controllers/participantController");
const authMiddleware_1 = require("../middleware/authMiddleware");
// Update status (Approve/Reject/Ban)
router.put("/:id", authMiddleware_1.protect, participantController_1.updateParticipantStatus);
exports.default = router;
