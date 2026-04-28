const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const addPropertyController = require("../controllers/addPropertyController");

router.post("/add-property", auth, addPropertyController.addProperty);
module.exports = router;
