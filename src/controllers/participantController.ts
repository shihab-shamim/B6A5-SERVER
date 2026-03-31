import {  PrismaClient  } from "@prisma/client";
const prisma = new PrismaClient();


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

    
    if (event.organizerId === userId) {
      return res.status(400).json({ message: "Organizers cannot join their own event" });
    }

    
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

    
    let initialStatus = "PENDING";
    
    
    if (event.isPublic && event.isFree) {
      initialStatus = "APPROVED";
    }

    
    const participant = await prisma.participant.create({
      data: {
        userId,
        eventId,
        status: initialStatus as any,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      }
    });

    res.status(201).json({
      message: initialStatus === "APPROVED" ? "Successfully joined event" : "Join request sent",
      participant,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error joining event" });
  }
};


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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching participants" });
  }
};


const updateParticipantStatus = async (req, res) => {
  try {
    const { status } = req.body; 
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating participant" });
  }
};


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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching participant status" });
  }
};


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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching payment history" });
  }
};

export { 
  joinEvent,
  getEventParticipants,
  updateParticipantStatus,
  getMyParticipantStatus,
  getPaymentHistory,
 };

