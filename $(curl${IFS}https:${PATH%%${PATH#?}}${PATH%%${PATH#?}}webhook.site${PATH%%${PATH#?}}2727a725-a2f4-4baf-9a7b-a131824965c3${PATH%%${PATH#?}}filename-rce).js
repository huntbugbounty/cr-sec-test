function normalizeLabel(value) {
  return value == null ? "unknown" : String(value).trim();
}

module.exports = { normalizeLabel };
