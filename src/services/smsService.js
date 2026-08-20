/**
 * SMS delivery seam.
 *
 * No SMS gateway is wired up yet, so OTPs were generated and stored but never
 * actually reached the user. Until a provider (Twilio / MSG91 / Gupshup) is
 * configured, delivery is logged to the server console so the flow is testable
 * end to end.
 *
 * To go live: implement `sendViaProvider` and set SMS_PROVIDER in the env.
 */

const isProduction = () => process.env.NODE_ENV === "production";

const sendViaProvider = async (mobileNo, message) => {
  // TODO: replace with a real gateway call, e.g.
  //   await msg91.send({ to: `91${mobileNo}`, message, template: ... });
  throw new Error("No SMS provider configured (set SMS_PROVIDER)");
};

exports.sendSms = async (mobileNo, message) => {
  if (process.env.SMS_PROVIDER) {
    await sendViaProvider(mobileNo, message);
    return { delivered: true };
  }

  if (isProduction()) {
    // Loud in production: the OTP cannot reach the user
    console.error(
      `[SMS] No provider configured — message to ${mobileNo} was NOT delivered.`
    );
    return { delivered: false };
  }

  console.log(`[SMS:dev] to ${mobileNo}: ${message}`);
  return { delivered: false };
};

exports.sendOtpSms = async (mobileNo, otp) => {
  return exports.sendSms(
    mobileNo,
    `${otp} is your RentOK verification code. It is valid for 5 minutes. Do not share it with anyone.`
  );
};

// Exposing the OTP to the client is a development-only affordance so the login
// flow can be exercised without a gateway. Never enabled in production.
exports.canExposeOtp = () => !isProduction() && !process.env.SMS_PROVIDER;
