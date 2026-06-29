const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const tenantController = require("../controllers/tenantController");
const { uploadDocument } = require("../middlewares/upload");

router.post(
  "/onboard-tenant",
  uploadDocument.fields([
    { name: "addressProof", maxCount: 1 },
    { name: "document", maxCount: 1 },
    { name: "documentFile", maxCount: 1 },
  ]),
  tenantController.onBoardTenant
);

router.delete("/delete-tenant/:id", auth, tenantController.deleteTenant);

module.exports = router;
