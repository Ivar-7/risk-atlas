const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

export function money(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `KES ${(value / 1_000_000_000).toFixed(2)}bn`;
  if (Math.abs(value) >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}m`;
  return kes.format(value);
}

export function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function clsLabel(value: string) {
  return value.replaceAll("_", " ");
}

/** Keep wording consistent when older saved runs still contain prior labels. */
export function presentModelText(value: string) {
  return value
    .replaceAll(/\bSYNTHETIC\b/g, 'SAMPLE')
    .replaceAll(/\bSynthetic\b/g, 'Sample')
    .replaceAll(/\bsynthetic\b/g, 'sample');
}
