/**
 * Returns "unknown" for null or undefined, or the trimmed string representation
 * of any other value. Empty and whitespace-only strings produce an empty string.
 * Errors thrown during string conversion propagate to the caller.
 */
function normalizeLabel(value) {
  return value == null ? "unknown" : String(value).trim();
}

module.exports = { normalizeLabel };
