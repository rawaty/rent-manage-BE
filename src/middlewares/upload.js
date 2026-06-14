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

// For landlord profile — images + PDFs
const uploadDocument = multer({ storage, fileFilter: documentFilter });

// For property images — images only
const uploadImage = multer({ storage, fileFilter: imageFilter });

module.exports = { uploadDocument, uploadImage };
