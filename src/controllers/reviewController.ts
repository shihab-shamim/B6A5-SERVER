import {  PrismaClient  } from "@prisma/client";
const prisma = new PrismaClient();

// @desc    Get all reviews for an event
// @route   GET /api/events/:id/reviews
// @access  Public
const getEventReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { eventId: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching reviews" });
  }
};

// @desc    Create a review
// @route   POST /api/events/:id/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Please provide rating and comment" });
    }

    // Check if user has participated in the event and status is APPROVED
    const participant = await prisma.participant.findUnique({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId,
        },
      },
    });

    if (!participant || participant.status !== "APPROVED") {
      return res.status(403).json({ message: "You must be an approved participant to review this event" });
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this event" });
    }

    const review = await prisma.review.create({
      data: {
        eventId,
        userId: req.user.id,
        rating: Number(rating),
        comment,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error creating review" });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this review" });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: rating ? Number(rating) : review.rating,
        comment: comment || review.comment,
      },
    });

    res.json(updatedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating review" });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting review" });
  }
};

// @desc    Get all reviews created by the logged in user
// @route   GET /api/reviews/me
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching my reviews" });
  }
};

export { 
  getEventReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
 };
