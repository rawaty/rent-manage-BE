const STATUS = require("../utils/statusCode");
const landlordProfileService = require("../services/landlordProfileService");

exports.createLandlordProfile = async (req, res) => {
  try {
    const landlordProfile = await landlordProfileService.createLandlordProfile(
      req.body
    );
    res.status(STATUS.CREATED).json({
      data: landlordProfile,
    });
  } catch (err) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getProfileData = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.body?.userId;
    if (!userId) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "userId is required",
      });
    }

    const getUserProfileData = await landlordProfileService.getProfileData(
      userId
    );
    res.status(STATUS.OK).json({
      success: true,
      data: getUserProfileData,
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
    res.status(STATUS.OK).json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      data: err.message,
    });
  }
};

exports.deleteLandlordProfile = async (req, res) => {
  try {
    const id = req.params.id;

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
