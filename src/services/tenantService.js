const Tenant = require("../models/Tenant");

exports.onBoardTenant = async (payload) => {
  const tenant = await Tenant.create(payload);
  return { success: true, data: tenant };
};
