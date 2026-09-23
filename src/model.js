export const low = (value) => String(value || "").toLowerCase();
const labels = {
  "ready-for-solutions": "Ready",
  "evidence-backed": "Backed",
  "user-stated": "Stated",
  partial_support: "Partial support",
  fail_in_slice: "Fails in slice",
};
export const pretty = (value) => {
  const text = String(value || "—");
  return labels[text.toLowerCase()] || text.replaceAll(/[-_]/g, " ");
};
export const date = (value) => (value ? value.slice(0, 10) : "—");
