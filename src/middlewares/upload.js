const multer = require("multer");

const storage = multer.memoryStorage();

// Allowed for landlord documents (profile images + PDFs)
const documentFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    const err = new Error("Only images and PDFs are allowed");
    err.status = 400;
    cb(err, false);
  }
};

// Allowed for property images (images only)
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    const err = new Error("Only image files are allowed (jpeg, png, webp, etc.)");
    err.status = 400;
    cb(err, false);
  }
};

// Files are buffered in memory before streaming to Cloudinary, so an unbounded
// upload is a straight route to an out-of-memory crash and a storage bill.
const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB per file
  files: 5,
  // Reject oversized multipart text fields too (e.g. a giant propertyData blob)
  fieldSize: 100 * 1024,
};

// For landlord profile — images + PDFs
const uploadDocument = multer({ storage, fileFilter: documentFilter, limits });

// For property images — images only
const uploadImage = multer({ storage, fileFilter: imageFilter, limits });

module.exports = { uploadDocument, uploadImage };
