const cloudinary = require("../config/cloudinary");

exports.uploadImage = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath);
  return result.secure_url;
};
