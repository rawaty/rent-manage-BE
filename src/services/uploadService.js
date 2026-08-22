const cloudinary = require("../config/cloudinary");

/**
 * Cloudinary uploads, split into two access classes.
 *
 * PUBLIC   — property photographs. These appear on the unauthenticated shared
 *            listing page, so they must be openly deliverable.
 *
 * PRIVATE  — identity documents, applicant photographs, address proofs, landlord
 *            KYC files and move-in/move-out evidence. Uploaded as Cloudinary
 *            `authenticated` assets, which are NOT retrievable from a bare URL:
 *            delivery requires a signature we mint only after checking that the
 *            caller owns the record.
 *
 * Everything defaults to PRIVATE. Making an asset public has to be a deliberate
 * act, so a new upload site can never leak personal data by omission.
 */

const PUBLIC = "public";
const PRIVATE = "private";

exports.VISIBILITY = { PUBLIC, PRIVATE };

// Cloudinary calls its private delivery type "authenticated"
const deliveryType = (visibility) =>
  visibility === PUBLIC ? "upload" : "authenticated";

const streamUpload = (buffer, folder, visibility) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        type: deliveryType(visibility),
        // PDFs and images both flow through these fields; let Cloudinary decide
        // and remember what it chose so we can sign correctly on read.
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          // Cloudinary's secure_url for an authenticated asset already carries a
          // non-expiring signature. Persisting it would turn the database — and
          // every API response — into a permanent bearer token for that file, so
          // private assets store no URL at all and are signed fresh on read.
          url: visibility === PUBLIC ? result.secure_url : null,
          public_id: result.public_id,
          resourceType: result.resource_type,
          visibility,
        });
      }
    );
    stream.end(buffer);
  });

exports.uploadSingle = async (file, folder = "general", visibility = PRIVATE) => {
  if (!file) return null;
  return streamUpload(file.buffer, folder, visibility);
};

exports.uploadMultiple = async (
  files = [],
  folder = "general",
  visibility = PRIVATE
) => {
  if (!files.length) return [];
  return Promise.all(files.map((f) => streamUpload(f.buffer, folder, visibility)));
};

/**
 * Mint a delivery URL for a stored asset.
 *
 * Public assets return their stored URL unchanged. Private assets get a signed
 * URL that Cloudinary rejects without a valid signature.
 *
 * Assets uploaded before this split have no `visibility` recorded; they are
 * genuinely public on Cloudinary, so they are returned as-is rather than signed
 * with a signature that would not match. See scripts/secure-existing-assets.js
 * for migrating them.
 *
 * NOTE: time-limited (expiring) signatures need Cloudinary's auth-token feature,
 * which is a paid add-on. On the free plan the signature does not expire, but the
 * URL is unguessable and is only ever issued after an ownership check.
 */
exports.signedUrl = (asset) => {
  if (!asset) return null;

  const publicId = asset.publicId || asset.public_id;
  if (!publicId) return asset.url || null;

  // Legacy asset, or a deliberately public one
  if (asset.visibility !== PRIVATE) return asset.url || null;

  return cloudinary.url(publicId, {
    type: "authenticated",
    resource_type: asset.resourceType || "image",
    sign_url: true,
    secure: true,
  });
};

/** Replace an asset's raw url with a signed one, preserving the other fields. */
exports.withSignedUrl = (asset) => {
  if (!asset) return null;

  const plain = typeof asset.toObject === "function" ? asset.toObject() : { ...asset };
  return { ...plain, url: exports.signedUrl(asset) };
};

//  Delete — the delivery type must match how the asset was uploaded
exports.deleteFile = async (publicId, options = {}) => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    type: deliveryType(options.visibility ?? PRIVATE),
    resource_type: options.resourceType || "image",
  });
};

/**
 * Delete many assets. Accepts either bare public ids (legacy callers, treated as
 * public uploads) or `{ publicId, visibility, resourceType }` descriptors.
 */
exports.deleteMultiple = async (assets = []) => {
  await Promise.all(
    assets.map((asset) => {
      if (typeof asset === "string") {
        // Legacy call site: try the public type, which is how they were stored
        return exports
          .deleteFile(asset, { visibility: PUBLIC })
          .catch(() => exports.deleteFile(asset, { visibility: PRIVATE }));
      }

      return exports.deleteFile(asset.publicId || asset.public_id, {
        visibility: asset.visibility,
        resourceType: asset.resourceType,
      });
    })
  );
};
