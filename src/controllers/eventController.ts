import {  PrismaClient  } from "@prisma/client";
const prisma = new PrismaClient();


const getEvents = async (req, res) => {
  try {
    const { search, category, isPublic, isFree } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { organizer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (isPublic !== undefined) {
      whereClause.isPublic = isPublic === "true";
    }

    if (isFree !== undefined) {
      whereClause.isFree = isFree === "true";
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        organizer: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { participants: { where: { status: "APPROVED" } }, reviews: true },
        },
      },
      orderBy: { date: "asc" },
    });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching events" });
  }
};


const getFeaturedEvent = async (req, res) => {
  try {
    const featured = await prisma.event.findFirst({
      where: { featuredByAdmin: true, date: { gte: new Date() } },
      include: {
        organizer: { select: { id: true, name: true } }
      },
      orderBy: { date: 'asc' }
    });

    if (featured) {
      res.json(featured);
    } else {
      
      const nextEvent = await prisma.event.findFirst({
        where: { isPublic: true, date: { gte: new Date() } },
         include: {
          organizer: { select: { id: true, name: true } }
        },
        orderBy: { date: 'asc' }
      });
      res.json(nextEvent || null);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching featured event" });
  }
};


const getUpcomingEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isPublic: true, date: { gte: new Date() } },
      take: 9,
      include: {
        organizer: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { date: 'asc' }
    });
    res.json(events);
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching upcoming events" });
  }
}


const getEventById = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        organizer: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { participants: { where: { status: "APPROVED" } } },
        },
      },
    });

    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching event" });
  }
};


const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, isPublic, isFree, fee, category } = req.body;

    if (!title || !description || !date || !time || !venue) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        venue,
        isPublic: isPublic !== undefined ? isPublic : true,
        isFree: isFree !== undefined ? isFree : true,
        fee: isFree ? 0 : parseFloat(fee),
        category,
        organizerId: req.user.id,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error creating event" });
  }
};


const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

   
    if (event.organizerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "User not authorized to update this event" });
    }

    const { title, description, date, time, venue, isPublic, isFree, fee, category } = req.body;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: title || event.title,
        description: description || event.description,
        date: date ? new Date(date) : event.date,
        time: time || event.time,
        venue: venue || event.venue,
        isPublic: isPublic !== undefined ? isPublic : event.isPublic,
        isFree: isFree !== undefined ? isFree : event.isFree,
        fee: isFree ? 0 : (fee !== undefined ? parseFloat(fee) : event.fee),
        category: category || event.category,
      }
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating event" });
  }
};


const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    
    if (event.organizerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "User not authorized to delete this event" });
    }

    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json({ message: "Event removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting event" });
  }
};

export { 
  getEvents,
  getFeaturedEvent,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
 };
