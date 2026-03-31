import express from "express";
const router = express.Router();
import {  getUsers, deleteUser, getAllEventsAdmin  } from "../controllers/adminController";
import {  protect, admin  } from "../middleware/authMiddleware";


router.use(protect, admin);

router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.get("/events", getAllEventsAdmin);


export default router;


