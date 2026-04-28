const Property = require("../models/Property");

exports.addProperty = async (payload) => {
  try {
    if (!payload.monthlyRent) {
      throw new Error("monthlyRent is required");
    }

    if (typeof payload.monthlyRent !== "number") {
      throw new Error("monthlyRent must be a number");
    }
    const property = await Property.create(payload);
    return property;
  } catch (err) {
    throw err;
  }
};
