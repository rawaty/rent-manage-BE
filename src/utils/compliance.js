const CONSTANT = require("./constants");

/**
 * Indian rental-compliance helpers.
 *
 * These produce *advisory* warnings rather than hard blocks: the Model Tenancy
 * Act has been adopted by only four states, and stamp duty / registration rules
 * are state-specific. Blocking a landlord in a state where a rule does not
 * apply would be wrong, so the product surfaces the risk and lets them decide.
 */

/**
 * Mask an identity number for storage.
 *
 * The Aadhaar Act and the DPDP Rules bar retaining a full Aadhaar number, so
 * only the last four digits survive. Applied to every id type for consistency.
 */
exports.maskIdNumber = (idNumber) => {
  if (!idNumber) return null;

  const clean = String(idNumber).replace(/\s+/g, "").toUpperCase();
  if (clean.length <= 4) return "X".repeat(clean.length);

  return "X".repeat(clean.length - 4) + clean.slice(-4);
};

/** Aadhaar is 12 digits; reject obvious typos before masking destroys evidence. */
exports.isPlausibleId = (idType, idNumber) => {
  if (!idType || !idNumber) return true; // optional field

  const clean = String(idNumber).replace(/\s+/g, "").toUpperCase();

  switch (idType) {
    case "AADHAAR":
      return /^\d{12}$/.test(clean);
    case "PASSPORT":
      return /^[A-Z][0-9]{7}$/.test(clean);
    case "VOTER_ID":
      return /^[A-Z]{3}[0-9]{7}$/.test(clean);
    case "DRIVING_LICENSE":
      return clean.length >= 9 && clean.length <= 20;
    default:
      return true;
  }
};

/**
 * Evaluate the tenancy terms against Indian rental law.
 * Returns a list of { code, severity, message } for the UI to display.
 */
exports.evaluateTenancyCompliance = ({
  monthlyRent,
  securityDeposit,
  tenancyMonths,
  propertyType,
  landlordState,
  landlordHasPan,
}) => {
  const warnings = [];

  const isCommercial = propertyType === "COMMERCIAL";
  const depositCapMonths = isCommercial
    ? CONSTANT.MTA_DEPOSIT_MONTHS_COMMERCIAL
    : CONSTANT.MTA_DEPOSIT_MONTHS_RESIDENTIAL;

  // ── Security deposit cap (Model Tenancy Act 2021) ──────────────────────────
  if (monthlyRent && securityDeposit) {
    const months = securityDeposit / monthlyRent;

    if (months > depositCapMonths) {
      const stateAdopted =
        landlordState &&
        CONSTANT.MTA_ADOPTED_STATES.includes(
          String(landlordState).trim().toUpperCase()
        );

      warnings.push({
        code: "DEPOSIT_ABOVE_MTA_CAP",
        severity: stateAdopted ? "high" : "medium",
        message: stateAdopted
          ? `Security deposit is ${months.toFixed(1)} months' rent. ${landlordState} has adopted the Model Tenancy Act, which caps it at ${depositCapMonths} months.`
          : `Security deposit is ${months.toFixed(1)} months' rent. The Model Tenancy Act caps this at ${depositCapMonths} months in states that have adopted it.`,
      });
    }
  }

  // ── Compulsory registration (Registration Act 1908, s.17) ─────────────────
  if (tenancyMonths && tenancyMonths > CONSTANT.REGISTRATION_EXEMPT_MAX_MONTHS) {
    warnings.push({
      code: "REGISTRATION_REQUIRED",
      severity: "high",
      message: `A ${tenancyMonths}-month tenancy must be registered with the sub-registrar. Agreements of ${CONSTANT.REGISTRATION_EXEMPT_MAX_MONTHS} months or less are exempt.`,
    });
  }

  // ── TDS on rent (Income-tax Act, s.194-IB) ────────────────────────────────
  if (monthlyRent > CONSTANT.TDS_194IB_MONTHLY_RENT_THRESHOLD) {
    warnings.push({
      code: "TDS_194IB_APPLIES",
      severity: "medium",
      message: `Rent exceeds ₹${CONSTANT.TDS_194IB_MONTHLY_RENT_THRESHOLD.toLocaleString(
        "en-IN"
      )}/month, so the tenant must deduct ${CONSTANT.TDS_194IB_RATE_PERCENT}% TDS under s.194-IB and file Form 26QC within 30 days of deduction.`,
    });
  }

  // ── Landlord PAN (needed by the tenant to claim HRA) ──────────────────────
  if (
    monthlyRent &&
    monthlyRent * 12 > CONSTANT.LANDLORD_PAN_ANNUAL_RENT_THRESHOLD &&
    landlordHasPan === false
  ) {
    warnings.push({
      code: "LANDLORD_PAN_MISSING",
      severity: "medium",
      message: `Annual rent exceeds ₹${CONSTANT.LANDLORD_PAN_ANNUAL_RENT_THRESHOLD.toLocaleString(
        "en-IN"
      )}. Add your PAN in Settings — the tenant needs it to claim HRA, and TDS is deducted at 20% instead of ${CONSTANT.TDS_194IB_RATE_PERCENT}% without it.`,
    });
  }

  return warnings;
};

/**
 * Police verification is the landlord's statutory duty (BNS s.223). The form
 * differs by city, so point them at the right one.
 */
exports.policeVerificationGuidance = (city) => {
  const normalised = String(city || "").trim().toUpperCase();

  const byCity = {
    DELHI: "Form C — submit via the Delhi Police tenant verification portal",
    "NEW DELHI":
      "Form C — submit via the Delhi Police tenant verification portal",
    MUMBAI: "Form 24 — submit at the local police station or Mumbai Police portal",
    BENGALURU: "Submit via the Bengaluru City Police tenant verification portal",
    BANGALORE: "Submit via the Bengaluru City Police tenant verification portal",
    PUNE: "Submit via the Pune Police citizen portal",
    HYDERABAD: "Submit via the Hyderabad Police citizen services portal",
  };

  return {
    formType: byCity[normalised] || "Submit at the local police station or your state police portal",
    // Most jurisdictions expect intimation within 24 hours of move-in
    dueWithinHours: 24,
    statute: "Section 223, Bharatiya Nyaya Sanhita",
  };
};

/** The itemised DPDP notice shown before any identity data is collected. */
exports.consentNotice = () => ({
  version: CONSTANT.CONSENT_VERSION,
  purposes: CONSTANT.CONSENT_PURPOSES,
});
