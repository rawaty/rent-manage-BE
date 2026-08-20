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
// Authenticated: a landlord may only list their own properties
router.post("/get-properties", auth, addPropertyController.getProperties);

// Shareable public listing link, used to show the property to prospects
router.get("/:propertyId/share", auth, addPropertyController.getShareLink);
router.patch(
  "/:propertyId/listing",
  auth,
  addPropertyController.setListingVisibility
);
module.exports = router;
