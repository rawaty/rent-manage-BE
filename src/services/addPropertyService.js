const Property = require("../models/Property");

exports.addProperty = async (payload) => {
  try {
    // console.log(payload);
    const property = await Property.create(payload);
    return property;
  } catch (err) {
    throw err;
  }
};
