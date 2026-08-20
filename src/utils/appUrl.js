/**
 * Resolves the public base URL of the frontend, for links we hand to people:
 * the shareable property listing and the tenant application form.
 *
 * These links are texted to prospective tenants, so the base URL must never be
 * taken from an unvalidated request header — a spoofed Origin would turn our
 * SMS into a phishing message. Every derived origin is checked against the same
 * allowlist CORS uses, so the two can never drift apart.
 *
 * Order of preference:
 *   1. APP_URL          — explicit configuration always wins
 *   2. request Origin   — the frontend that called us, if allowlisted
 *   3. request Referer  — same check, for clients that omit Origin
 *   4. null             — caller reports a clear error rather than emitting
 *                         a localhost link that is broken for the recipient
 */

const configuredOrigins = () =>
  (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const stripTrailingSlash = (url) => url.replace(/\/+$/, "");

const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

/**
 * Shared with the CORS middleware so an origin good enough to call the API is
 * exactly the set of origins good enough to appear in a link we send out.
 */
exports.isAllowedOrigin = (origin) => {
  if (!origin) return false;

  const allowed = configuredOrigins();
  if (allowed.includes(origin)) return true;

  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  // Vercel preview deployments, over HTTPS only
  if (parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel.app")) {
    return true;
  }

  // With nothing configured, keep local development working
  if (!allowed.length && LOCAL_ORIGINS.includes(origin)) return true;

  return false;
};

/** The origin of the request, from Origin or falling back to Referer. */
const originOfRequest = (req) => {
  const origin = req?.headers?.origin;
  if (origin) return origin;

  const referer = req?.headers?.referer;
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
};

/**
 * @returns {string|null} base URL with no trailing slash, or null when it
 *                        cannot be determined safely.
 */
exports.resolveAppUrl = (req) => {
  if (process.env.APP_URL) return stripTrailingSlash(process.env.APP_URL);

  const origin = originOfRequest(req);
  if (origin && exports.isAllowedOrigin(origin)) return stripTrailingSlash(origin);

  return null;
};

/** Build a link onto the resolved frontend, or null if it cannot be resolved. */
exports.buildAppLink = (req, path) => {
  const base = exports.resolveAppUrl(req);
  if (!base) return null;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

exports.UNRESOLVED_MESSAGE =
  "Could not determine the app address for this link. Set APP_URL on the server.";
