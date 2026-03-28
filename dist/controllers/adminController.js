"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEventsAdmin = exports.deleteUser = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching users" });
    }
};
exports.getUsers = getUsers;
// @desc    Delete a user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role === "ADMIN") {
            return res.status(400).json({ message: "Cannot delete an admin user" });
        }
        await prisma.user.delete({
            where: { id: req.params.id },
        });
        res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error deleting user" });
    }
};
exports.deleteUser = deleteUser;
// @desc    Get all events including private ones (Admin only)
// @route   GET /api/admin/events
// @access  Private/Admin
const getAllEventsAdmin = async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            include: {
                organizer: { select: { id: true, name: true, email: true } },
                _count: { select: { participants: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(events);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching all events" });
    }
};
exports.getAllEventsAdmin = getAllEventsAdmin;
