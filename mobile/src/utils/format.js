/**
 * Format a number as a USD price string.
 * e.g. 312.06 → "$312.06"
 */
export function formatPrice(value) {
  return `$${(value ?? 0).toFixed(2)}`;
}

/**
 * Format a percentage change with sign.
 * e.g. 5.45 → "+5.45%"   -2.51 → "-2.51%"
 */
export function formatPercent(value) {
  const n = value ?? 0;
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

/**
 * Format an absolute price change with sign.
 * e.g. 23.25 → "+23.25"   -9.79 → "-9.79"
 */
export function formatChange(value) {
  const n = value ?? 0;
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
}

/**
 * Return the theme color for a positive/negative value.
 */
export function changeColor(value) {
  return (value ?? 0) >= 0 ? '#00D09C' : '#FF4B4B';
}
