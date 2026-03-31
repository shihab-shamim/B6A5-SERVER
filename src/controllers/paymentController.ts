import Stripe from "stripe";
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || "sk_test_PLACEHOLDER");
import {  PrismaClient  } from "@prisma/client";
const prisma = new PrismaClient();


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
            unit_amount: Math.round(event.fee * 100), 
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
  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Server error creating payment session" });
  }
};


const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const { eventId, userId } = session.metadata;
    const paidAmount = session.amount_total / 100;
    const paymentId = session.payment_intent;

    try {
      
      const dbEvent = await prisma.event.findUnique({ where: { id: eventId } });
      const initialStatus: any = dbEvent?.isPublic ? "APPROVED" : "PENDING";

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
    } catch (dbError) {
      console.error("Database error in webhook processing:", dbError);
    }
  }

  
  res.send();
};



const verifyPayment = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ message: "Event not found" });

    
    const sessions = await stripe.checkout.sessions.list({ limit: 20 });
    const paidSession = sessions.data.find(s => 
      s.client_reference_id === userId && 
      s.metadata?.eventId === eventId && 
      s.payment_status === "paid"
    );

    if (!paidSession) {
      return res.status(400).json({ message: "No completed payment found for this event" });
    }

    
    const initialStatus: any = event.isPublic ? "APPROVED" : "PENDING";
    const paidAmount = paidSession.amount_total / 100;

    await prisma.participant.upsert({
      where: {
        userId_eventId: { userId, eventId },
      },
      update: {
        status: initialStatus,
        paidAmount,
        paymentId: (paidSession.payment_intent as string) || paidSession.id,
      },
      create: {
        userId,
        eventId,
        status: initialStatus,
        paidAmount,
        paymentId: (paidSession.payment_intent as string) || paidSession.id,
      },
    });

    res.json({ success: true, status: initialStatus });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Server error verifying payment" });
  }
};

export { 
  createCheckoutSession,
  webhook,
  verifyPayment,
 };
