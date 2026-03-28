"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
// All admin routes must be protected and restricted to admin
router.use(authMiddleware_1.protect, authMiddleware_1.admin);
router.get("/users", adminController_1.getUsers);
router.delete("/users/:id", adminController_1.deleteUser);
router.get("/events", adminController_1.getAllEventsAdmin);
// Note: delete event by admin is handled in eventController.js (`DELETE /api/events/:id`)
exports.default = router;
