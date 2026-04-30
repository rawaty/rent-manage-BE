const Tenant = require("../models/Property");
exports.onBoardTenant = async (payload) => {
  try {
    const tenant = await Tenant.create(payload);
    return tenant;
  } catch (err) {
    throw err;
  }
};
