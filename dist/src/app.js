import express from "express";
import cors from "cors";
import paymentsRoute from "./routes/payments";
import authRoute from "./routes/auth";
import eventsRoute from "./routes/events";
import participantsRoute from "./routes/participants";
import invitationsRoute from "./routes/invitations";
import reviewsRoute from "./routes/reviews";
import adminRoute from "./routes/admin";
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
// Special route for Stripe Webhook (needs raw body)
const webhookRoute = paymentsRoute.stack?.find((r) => r.route?.path === '/webhook');
if (webhookRoute) {
    app.use("/api/payments/webhook", express.raw({ type: "application/json" }), webhookRoute.handle);
}
// Only parse JSON for subsequent routes
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.use("/api/auth", authRoute);
app.use("/api/events", eventsRoute);
app.use("/api/participants", participantsRoute);
app.use("/api/invitations", invitationsRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/admin", adminRoute);
app.use("/api/payments", paymentsRoute);
// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});
export default app;
module.exports = app;
//# sourceMappingURL=app.js.map