import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// @desc    Join or request to join an event
// @route   POST /api/events/:id/join
// @access  Private
const joinEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        // Check if user is the organizer
        if (event.organizerId === userId) {
            return res.status(400).json({ message: "Organizers cannot join their own event" });
        }
        // Check if already participant
        const existingParticipant = await prisma.participant.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
        });
        if (existingParticipant) {
            return res.status(400).json({ message: `You have already ${existingParticipant.status.toLowerCase()} this event` });
        }
        // Determine initial status based on event rules
        let initialStatus = "PENDING";
        // If event is public and free, auto-approve
        if (event.isPublic && event.isFree) {
            initialStatus = "APPROVED";
        }
        // Wait, for paid events, the payment process should handle approval, 
        // but for now we create a pending request.
        const participant = await prisma.participant.create({
            data: {
                userId,
                eventId,
                status: initialStatus,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            }
        });
        res.status(201).json({
            message: initialStatus === "APPROVED" ? "Successfully joined event" : "Join request sent",
            participant,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error joining event" });
    }
};
// @desc    Get event participants
// @route   GET /api/events/:id/participants
// @access  Private (Owner)
const getEventParticipants = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if (event.organizerId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Not authorized" });
        }
        const participants = await prisma.participant.findMany({
            where: { eventId },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(participants);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching participants" });
    }
};
// @desc    Update participant status (approve/reject/ban)
// @route   PUT /api/participants/:id
// @access  Private (Owner)
const updateParticipantStatus = async (req, res) => {
    try {
        const { status } = req.body; // "APPROVED", "REJECTED", "BANNED"
        const participantId = req.params.id;
        if (!["APPROVED", "REJECTED", "BANNED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        const participant = await prisma.participant.findUnique({
            where: { id: participantId },
            include: { event: true },
        });
        if (!participant) {
            return res.status(404).json({ message: "Participant record not found" });
        }
        if (participant.event.organizerId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Not authorized to modify participants for this event" });
        }
        const updatedParticipant = await prisma.participant.update({
            where: { id: participantId },
            data: { status },
            include: {
                user: { select: { id: true, name: true, email: true } },
            }
        });
        res.json(updatedParticipant);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error updating participant" });
    }
};
// @desc    Get current user's participant status for an event
// @route   GET /api/events/:id/my-status
// @access  Private
const getMyParticipantStatus = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        const participant = await prisma.participant.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
        });
        if (!participant) {
            return res.json({ status: null });
        }
        res.json({ status: participant.status });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching participant status" });
    }
};
// @desc    Get current user's payment and participation history
// @route   GET /api/events/my-payments
// @access  Private
const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await prisma.participant.findMany({
            where: { userId },
            include: {
                event: {
                    select: { id: true, title: true, date: true, isFree: true, fee: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(history);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching payment history" });
    }
};
export { joinEvent, getEventParticipants, updateParticipantStatus, getMyParticipantStatus, getPaymentHistory, };
//# sourceMappingURL=participantController.js.map