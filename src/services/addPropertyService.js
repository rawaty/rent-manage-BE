const Property = require("../models/Property");

exports.addProperty = async (payload) => {
  try {
    if (!payload.monthlyRent) {
      return { success: false, message: "monthlyRent is required" };
    }

    if (typeof payload.monthlyRent !== "number") {
      return { success: false, message: "monthlyRent must be a number" };
    }
    const property = await Property.create(payload);
    return property;
  } catch (err) {
    throw err;
  }
};
