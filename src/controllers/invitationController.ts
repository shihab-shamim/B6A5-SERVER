import {  PrismaClient  } from "@prisma/client";
const prisma = new PrismaClient();


const sendInvitation = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { inviteeEmail } = req.body;
    const inviterId = req.user.id;

    if (!inviteeEmail) {
      return res.status(400).json({ message: "Please provide an invitee email" });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId !== inviterId && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to invite to this event" });
    }

    const invitee = await prisma.user.findUnique({
      where: { email: inviteeEmail },
    });

    if (!invitee) {
      return res.status(404).json({ message: "User with this email not found" });
    }

    
    const existingParticipant = await prisma.participant.findUnique({
      where: {
        userId_eventId: {
          userId: invitee.id,
          eventId: eventId,
        },
      },
    });

    if (existingParticipant) {
      return res.status(400).json({ message: "User is already an active participant or has requested to join" });
    }

    
    const existingInvitation = await prisma.invitation.findUnique({
      where: {
        eventId_inviteeId: {
          eventId: eventId,
          inviteeId: invitee.id,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === "PENDING") {
      return res.status(400).json({ message: "Invitation already sent to this user" });
    }

    const invitation = await prisma.invitation.create({
      data: {
        eventId,
        inviterId,
        inviteeId: invitee.id,
        status: "PENDING",
      },
    });

    res.status(201).json({ message: "Invitation sent successfully", invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error sending invitation" });
  }
};


const getMyInvitations = async (req, res) => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: { inviteeId: req.user.id },
      include: {
        event: {
          select: { id: true, title: true, date: true, fee: true, isFree: true, isPublic: true },
        },
        inviter: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(invitations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching invitations" });
  }
};


const updateInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id;
    const { status } = req.body; 

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { event: true },
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.inviteeId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this invitation" });
    }

    
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status },
    });

    
    if (status === "ACCEPTED") {
      
      const participantStatus = invitation.event.isFree ? "APPROVED" : "PENDING";
      
      await prisma.participant.upsert({
        where: {
          userId_eventId: {
            userId: req.user.id,
            eventId: invitation.eventId,
          },
        },
        update: { status: participantStatus },
        create: {
          userId: req.user.id,
          eventId: invitation.eventId,
          status: participantStatus,
        },
      });
    }

    res.json(updatedInvitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating invitation" });
  }
};

export { 
  sendInvitation,
  getMyInvitations,
  updateInvitation,
 };
