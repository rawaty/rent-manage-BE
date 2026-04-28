require("dotenv").config();

const app = require("./app");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const RETRY_DELAY_MS = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});

const connectWithRetry = async () => {
  if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI in environment variables.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ DB Connected");
  } catch (err) {
    console.error(`❌ DB Error: ${err.message}`);
    console.log(`↻ Retrying DB connection in ${RETRY_DELAY_MS / 1000}s...`);
    setTimeout(connectWithRetry, RETRY_DELAY_MS);
  }
};

connectWithRetry();
