const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const addPropertyController = require("../controllers/addPropertyController");

router.post("/add-property", auth, addPropertyController.addProperty);
router.put(
  "/update-property/:propertyId",
  auth,
  addPropertyController.updateProperty
);
router.delete(
  "/delete-property/:propertyId",
  auth,
  addPropertyController.deleteProperty
);
router.get("/get-properties", addPropertyController.getProperties);
module.exports = router;
