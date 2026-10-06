/**
 * Currency and number formatting with Indian number system support.
 */

export function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '₹0.00';
  return '₹' + val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumberINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0.00';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
