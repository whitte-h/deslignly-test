import { COLORS } from './theme';

const hexToRgba = (hex, opacity) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${opacity})`;
  const [r, g, b] = [result[1], result[2], result[3]].map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${opacity})`;
};

/**
 * Base chart config shared by all LineChart instances.
 * Pass `accentColor` to override the line/dot color (defaults to COLORS.up).
 */
const makeChartConfig = (accentColor = COLORS.up) => ({
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 2,
  color: (opacity = 1) => hexToRgba(accentColor, opacity),
  labelColor: () => COLORS.muted,
  propsForDots: { r: '4', strokeWidth: '2', stroke: accentColor },
});

export { makeChartConfig };
