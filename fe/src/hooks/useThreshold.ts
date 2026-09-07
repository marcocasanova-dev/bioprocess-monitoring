export type ThresholdStatus = "below" | "in-range" | "above" | "unset";

/**
 * Compares a raw absorbance reading against a user-supplied range — not a
 * calibrated concentration. The system never decides what the "right" value
 * is; it only flags whether the number the user typed in has been crossed.
 * `null` on either bound means that side is open (no floor / no ceiling).
 */
export function getThresholdStatus(value: number | null | undefined, min: number | null, max: number | null): ThresholdStatus {
  if (min === null && max === null) return "unset";
  if (value == null || Number.isNaN(value)) return "unset";
  if (min !== null && value < min) return "below";
  if (max !== null && value > max) return "above";
  return "in-range";
}

export const THRESHOLD_COLOR: Record<ThresholdStatus, string> = {
  below: "#f5c518", // amber — under the floor
  "in-range": "#35d07f", // green — within the user's range
  above: "#ef5350", // red — over the ceiling
  unset: "#f9a84f", // the original neutral marker color, no range defined
};
