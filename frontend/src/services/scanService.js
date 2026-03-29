import { API_BASE_URL } from "../config/api.js";

export async function runScan(url) {
  const res = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  if (data?.success === false) {
    const msg = data.message || "Scan failed";
    if (res.status === 504) throw new Error(msg || "Scan timed out");
    if (res.status === 400) throw new Error(msg || "Invalid URL");
    if (res.status === 500) throw new Error(msg || "Server error");
    throw new Error(msg);
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    if (res.status === 504) throw new Error(msg || "Scan timed out");
    if (res.status === 400) throw new Error(msg || "Invalid URL");
    if (res.status === 500) throw new Error(msg || "Server error");
    throw new Error(msg);
  }

  return data;
}
