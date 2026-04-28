const express = require("express");
const landlordProfileRoute = require("./routes/landlordProfileRoutes");
const bankDetailsRoute = require("./routes/bankDetailsRoutes");
const authRoute = require("./routes/authRouter");
const addPropertyRoute = require("./routes/addPropertyRouter");
const app = express();

app.use(express.json());

app.use("/api/landlord-profile", landlordProfileRoute);
app.use("/api/bankDetails", bankDetailsRoute);
app.use("/api/auth", authRoute);
app.use("/api/property", addPropertyRoute);

module.exports = app;
