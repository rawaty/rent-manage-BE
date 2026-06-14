const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { uploadImage } = require("../middlewares/upload");
const addPropertyController = require("../controllers/addPropertyController");

router.post(
  "/add-property",
  auth,
  uploadImage.fields([{ name: "propertyImages", maxCount: 5 }]),
  addPropertyController.addProperty
);
router.put(
  "/update-property/:propertyId",
  auth,
  uploadImage.fields([{ name: "propertyImages", maxCount: 5 }]),
  addPropertyController.updateProperty
);
router.delete(
  "/delete-property/:propertyId",
  auth,
  addPropertyController.deleteProperty
);
router.post("/get-properties", addPropertyController.getProperties);
module.exports = router;
