/**
 * Minimal Cookie header parser.
 *
 * The app does not use cookie-parser, so `req.cookies` is undefined. Rather
 * than add a dependency for a single lookup, read the raw header directly.
 */
exports.getCookie = (req, name) => {
  // Respect cookie-parser if it is ever added to the stack.
  if (req.cookies && req.cookies[name]) return req.cookies[name];

  const header = req.headers?.cookie;
  if (!header) return null;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;

    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }

  return null;
};
