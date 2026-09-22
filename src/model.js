export const low = (value) => String(value || "").toLowerCase();
export const pretty = (value) => String(value || "—").replaceAll("-", " ");
export const date = (value) => (value ? value.slice(0, 10) : "—");
