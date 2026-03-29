export function normalizeScanUrl(raw) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isLikelyValidUrl(raw) {
  const normalized = normalizeScanUrl(raw);
  if (!normalized) return false;
  try {
    const u = new URL(normalized);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
