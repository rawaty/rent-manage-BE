const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const tenantController = require("../controllers/tenantController");
const { uploadDocument } = require("../middlewares/upload");

// ─── Read ─────────────────────────────────────────────────────────────────────
router.get("/", auth, tenantController.listTenants);
router.get("/:id", auth, tenantController.getTenant);

// ─── Create ───────────────────────────────────────────────────────────────────
// Direct onboarding, bypassing the enquiry → application journey
router.post(
  "/onboard-tenant",
  auth,
  uploadDocument.fields([
    { name: "addressProof", maxCount: 1 },
    { name: "document", maxCount: 1 },
    { name: "documentFile", maxCount: 1 },
  ]),
  tenantController.onBoardTenant
);

// ─── Update ───────────────────────────────────────────────────────────────────
router.patch("/:id", auth, tenantController.updateTenant);
router.patch(
  "/:id/police-verification",
  auth,
  tenantController.updatePoliceVerification
);

// Ends the tenancy and frees the property, keeping the tenant record as history
router.post("/:id/vacate", auth, tenantController.vacateTenant);

// ─── Delete ───────────────────────────────────────────────────────────────────
router.delete("/delete-tenant/:id", auth, tenantController.deleteTenant);

module.exports = router;
