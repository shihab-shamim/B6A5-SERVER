"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const payments_1 = __importDefault(require("./routes/payments"));
const auth_1 = __importDefault(require("./routes/auth"));
const events_1 = __importDefault(require("./routes/events"));
const participants_1 = __importDefault(require("./routes/participants"));
const invitations_1 = __importDefault(require("./routes/invitations"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            "http://localhost:3000",
        ].filter(Boolean);
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin)
            return callback(null, true);
        // Allow any *.vercel.app subdomain or listed origins
        if (origin.endsWith(".vercel.app") ||
            allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
// Special route for Stripe Webhook (needs raw body)
const webhookRoute = payments_1.default.stack?.find((r) => r.route?.path === '/webhook');
if (webhookRoute) {
    app.use("/api/payments/webhook", express_1.default.raw({ type: "application/json" }), webhookRoute.handle);
}
// Only parse JSON for subsequent routes
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.use("/api/auth", auth_1.default);
app.use("/api/events", events_1.default);
app.use("/api/participants", participants_1.default);
app.use("/api/invitations", invitations_1.default);
app.use("/api/reviews", reviews_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/payments", payments_1.default);
// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});
exports.default = app;
module.exports = app;
