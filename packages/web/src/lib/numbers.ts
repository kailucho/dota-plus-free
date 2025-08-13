export function sanitize2Digits(v: string, max?: number, min = 0) {
  const digits = v.replace(/\D/g, "").slice(0, 2);
  if (digits === "") return "";
  let n = Number(digits);
  if (!Number.isFinite(n)) return "";
  if (max != null && n > max) n = max;
  if (n < min) n = min;
  return String(n);
}
