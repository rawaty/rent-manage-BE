const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const addPropertyController = require("../controllers/addPropertyController");

router.post(
  "/add-property",
  auth,
  upload.fields([{ name: "propertyImages", maxCount: 5 }]),
  addPropertyController.addProperty
);
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
router.post("/get-properties", addPropertyController.getProperties);
module.exports = router;
