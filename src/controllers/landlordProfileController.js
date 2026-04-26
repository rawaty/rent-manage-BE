const STATUS = require("../utils/statusCode");
const landlordProfileService = require("../services/landlordProfileService");
const { STATES } = require("mongoose");

exports.createLandlordProfile = async (req, res) => {
  try {
    const landlordProfile = await landlordProfileService.createLandlordProfile(
      req.body
    );
    res.status(STATUS.CREATED).json({
      success: true,
      data: landlordProfile,
    });
  } catch (err) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateLandlordProfile = async (req, res) => {
  try {
    const updatedUser = await landlordProfileService.updateLandlordProfile(
      req.body
    );
    res.status(STATES).json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    res.status(STATES).json({
      success: true,
      data: err.message,
    });
  }
};

exports.deleteLandlordProfile = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const result = await landlordProfileService.deleteLandlordProfile(id);
    return res.status(STATUS.OK).json({
      success: true,
      message: "Deleted successfully",
      result,
    });
  } catch (err) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};
