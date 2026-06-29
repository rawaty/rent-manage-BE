const express = require("express");
const cors = require("cors");
const landlordProfileRoute = require("./routes/landlordProfileRoutes");
const bankDetailsRoute = require("./routes/bankDetailsRoutes");
const authRoute = require("./routes/authRouter");
const addPropertyRoute = require("./routes/addPropertyRouter");
const otpRoute = require("./routes/otpRouter");
const tenantRoute = require("./routes/tenantRouter");
const errorHandler = require("./middlewares/errorHandler");
const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (Postman/cURL/server-to-server)
      if (!origin) return callback(null, true);

      // Always allow Vercel preview deployments
      if (origin.endsWith(".vercel.app")) return callback(null, true);

      // If no env is set, allow localhost to keep local dev easy
      if (!allowedOrigins.length) {
        const localAllowed = ["http://localhost:3000", "http://127.0.0.1:3000"];
        if (localAllowed.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      }

      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/landlord-profile", landlordProfileRoute);
app.use("/api/bankDetails", bankDetailsRoute);
app.use("/api/auth", authRoute);
app.use("/api/property", addPropertyRoute);
app.use("/api/otp", otpRoute);
app.use("/api/tenant", tenantRoute);

// Global error handler — must be last
app.use(errorHandler);

module.exports = app;
