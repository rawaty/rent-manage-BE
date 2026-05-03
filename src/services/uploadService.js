const cloudinary = require("../config/cloudinary");

//stream upload
const streamUpload = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
};

exports.uploadSingle = async (file, folder = "general") => {
  if (!file) return null;
  return await streamUpload(file.buffer, folder);
};

exports.uploadMultiple = async (files = [], folder = "general") => {
  if (!files.length) return [];

  const uploads = files.map((file) => streamUpload(file.buffer, folder));

  return await Promise.all(uploads);
};

//  Delete
exports.deleteFile = async (public_id) => {
  if (!public_id) return;
  await cloudinary.uploader.destroy(public_id);
};

// Delete multiple
exports.deleteMultiple = async (publicIds = []) => {
  await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id)));
};
