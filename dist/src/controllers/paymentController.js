import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER");
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/create-session
// @access  Private
const createCheckoutSession = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if (event.isFree || !event.fee) {
            return res.status(400).json({ message: "This event is free, no payment required" });
        }
        // Check if user is already a participant
        const existingParticipant = await prisma.participant.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
        });
        if (existingParticipant && existingParticipant.status === "APPROVED") {
            return res.status(400).json({ message: "You are already a participant" });
        }
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: event.title,
                            description: event.description.substring(0, 100),
                        },
                        unit_amount: Math.round(event.fee * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/events/${eventId}?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/events/${eventId}?canceled=true`,
            customer_email: userEmail,
            client_reference_id: userId,
            metadata: {
                eventId: event.id,
                userId: userId,
            },
        });
        res.json({ id: session.id, url: session.url });
    }
    catch (error) {
        console.error("Stripe Session Error:", error);
        res.status(error.statusCode || 500).json({ message: error.message || "Server error creating payment session" });
    }
};
// @desc    Stripe Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (Called by Stripe)
const webhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        // Note: req.body MUST be raw buffer for Stripe signature verification
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { eventId, userId } = session.metadata;
        const paidAmount = session.amount_total / 100;
        const paymentId = session.payment_intent;
        try {
            // Create or update participant
            // For paid public events, maybe auto-approve. For private, PENDING.
            const dbEvent = await prisma.event.findUnique({ where: { id: eventId } });
            const initialStatus = dbEvent?.isPublic ? "APPROVED" : "PENDING";
            await prisma.participant.upsert({
                where: {
                    userId_eventId: {
                        userId: userId,
                        eventId: eventId,
                    },
                },
                update: {
                    status: initialStatus,
                    paidAmount: paidAmount,
                    paymentId: paymentId,
                },
                create: {
                    userId: userId,
                    eventId: eventId,
                    status: initialStatus,
                    paidAmount: paidAmount,
                    paymentId: paymentId,
                },
            });
            console.log(`Payment successful for user ${userId} and event ${eventId}`);
        }
        catch (dbError) {
            console.error("Database error in webhook processing:", dbError);
        }
    }
    // Return a 200 response to acknowledge receipt of the event
    res.send();
};
// @desc    Manually Verify Payment (Development/Fallback when webhooks are blocked)
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user.id;
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            return res.status(404).json({ message: "Event not found" });
        // Query Stripe for recent checkout sessions to find if this user paid for this event
        const sessions = await stripe.checkout.sessions.list({ limit: 20 });
        const paidSession = sessions.data.find(s => s.client_reference_id === userId &&
            s.metadata?.eventId === eventId &&
            s.payment_status === "paid");
        if (!paidSession) {
            return res.status(400).json({ message: "No completed payment found for this event" });
        }
        // Auto-approve public events, set private to pending
        const initialStatus = event.isPublic ? "APPROVED" : "PENDING";
        const paidAmount = paidSession.amount_total / 100;
        await prisma.participant.upsert({
            where: {
                userId_eventId: { userId, eventId },
            },
            update: {
                status: initialStatus,
                paidAmount,
                paymentId: paidSession.payment_intent || paidSession.id,
            },
            create: {
                userId,
                eventId,
                status: initialStatus,
                paidAmount,
                paymentId: paidSession.payment_intent || paidSession.id,
            },
        });
        res.json({ success: true, status: initialStatus });
    }
    catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ message: "Server error verifying payment" });
    }
};
export { createCheckoutSession, webhook, verifyPayment, };
//# sourceMappingURL=paymentController.js.map