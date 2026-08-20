const express = require("express");
const router = express.Router();

const enquiryController = require("../controllers/enquiryController");
const applicationController = require("../controllers/applicationController");
const { uploadDocument } = require("../middlewares/upload");
const {
  publicReadLimiter,
  publicWriteLimiter,
} = require("../middlewares/rateLimiter");

/**
 * Unauthenticated routes reachable by a prospective tenant holding a link.
 *
 * Everything here is rate limited and returns only sanitised data — there is
 * no session behind these requests, so nothing may leak landlord or tenant PII.
 */

// Shared property listing — the page a landlord sends to a prospect
router.get(
  "/property/:publicId",
  publicReadLimiter,
  enquiryController.getPublicProperty
);

// "I'm Interested" CTA
router.post(
  "/property/:publicId/interest",
  publicWriteLimiter,
  enquiryController.createEnquiry
);

// Tokenised tenant application form
router.get(
  "/application/:token",
  publicReadLimiter,
  applicationController.getByToken
);

router.post(
  "/application/:token",
  publicWriteLimiter,
  uploadDocument.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "photograph", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  applicationController.submitByToken
);

module.exports = router;
