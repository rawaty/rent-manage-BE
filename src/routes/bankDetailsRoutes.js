const express = require("express");

const router = express.Router();
const bankdetails = require("../controllers/bankDetailsController");
const auth = require("../middlewares/authMiddleware");

router.post("/", auth, bankdetails.createBankDetails);

module.exports = router;
