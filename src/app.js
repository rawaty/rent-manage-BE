const express = require("express");
const cors = require("cors");
const landlordProfileRoute = require("./routes/landlordProfileRoutes");
const bankDetailsRoute = require("./routes/bankDetailsRoutes");
const authRoute = require("./routes/authRouter");
const addPropertyRoute = require("./routes/addPropertyRouter");
const otpRoute = require("./routes/otpRouter");
const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://your-nextjs-app.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/landlord-profile", landlordProfileRoute);
app.use("/api/bankDetails", bankDetailsRoute);
app.use("/api/auth", authRoute);
app.use("/api/property", addPropertyRoute);
app.use("/api/otp", otpRoute);

module.exports = app;
