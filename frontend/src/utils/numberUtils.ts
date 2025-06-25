/**
 * Utility functions for safe number handling and formatting
 */

/**
 * Safely converts a value to a number and formats it with toFixed
 * @param value - The value to convert and format
 * @param decimals - Number of decimal places (default: 2)
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Formatted number string
 */
export const safeToFixed = (
  value: any,
  decimals: number = 2,
  fallback: number = 0
): string => {
  const numValue = Number(value);
  if (isNaN(numValue) || !isFinite(numValue)) {
    return Number(fallback).toFixed(decimals);
  }
  return numValue.toFixed(decimals);
};

/**
 * Safely converts a value to a number
 * @param value - The value to convert
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Safe number value
 */
export const safeNumber = (value: any, fallback: number = 0): number => {
  const numValue = Number(value);
  if (isNaN(numValue) || !isFinite(numValue)) {
    return fallback;
  }
  return numValue;
};

/**
 * Formats a currency value safely
 * @param value - The value to format
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Formatted currency string with $ prefix
 */
export const formatCurrency = (value: any, fallback: number = 0): string => {
  return `$${safeToFixed(value, 2, fallback)}`;
};

/**
 * Formats a percentage value safely
 * @param value - The value to format (as decimal, e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 2)
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Formatted percentage string with % suffix
 */
export const formatPercentage = (
  value: any,
  decimals: number = 2,
  fallback: number = 0
): string => {
  return `${safeToFixed(value, decimals, fallback)}%`;
};
