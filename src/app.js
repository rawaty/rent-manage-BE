const express = require("express");
const cors = require("cors");
const landlordProfileRoute = require("./routes/landlordProfileRoutes");
const bankDetailsRoute = require("./routes/bankDetailsRoutes");
const authRoute = require("./routes/authRouter");
const addPropertyRoute = require("./routes/addPropertyRouter");
const otpRoute = require("./routes/otpRouter");
const tenantRoute = require("./routes/tenantRouter");
const publicRoute = require("./routes/publicRouter");
const enquiryRoute = require("./routes/enquiryRouter");
const applicationRoute = require("./routes/applicationRouter");
const notificationRoute = require("./routes/notificationRouter");
const errorHandler = require("./middlewares/errorHandler");
const { isAllowedOrigin } = require("./utils/appUrl");
const app = express();

// Render (and most PaaS) terminate TLS at a proxy. Without this, every request
// looks like it comes from the proxy IP and the public rate limiters would
// throttle all visitors as one.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (Postman/cURL/server-to-server)
      if (!origin) return callback(null, true);

      // Same allowlist used to build tenant-facing links — see utils/appUrl
      if (isAllowedOrigin(origin)) return callback(null, true);

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

// Unauthenticated, link-holder routes for prospective tenants
app.use("/api/public", publicRoute);

app.use("/api/enquiry", enquiryRoute);
app.use("/api/application", applicationRoute);
app.use("/api/notification", notificationRoute);

// Global error handler — must be last
app.use(errorHandler);

module.exports = app;
