/**
 * Utility functions for voucher operations
 */

// Simple counter for voucher numbers (in production, this should come from backend)
let voucherCounters = {
  PV: 0, // Payment Voucher
  RV: 0, // Receipt Voucher  
  JV: 0  // Journal Voucher
};

/**
 * Generate sequential voucher number
 * @param type - Voucher type (PV, RV, JV)
 * @returns Formatted voucher number like PV-001, RV-002, etc.
 */
export const generateVoucherNumber = (type: 'PV' | 'RV' | 'JV'): string => {
  voucherCounters[type]++;
  const paddedNumber = voucherCounters[type].toString().padStart(3, '0');
  return `${type}-${paddedNumber}`;
};

/**
 * Initialize voucher counters (useful for setting starting numbers)
 * @param counters - Object with starting numbers for each voucher type
 */
export const initializeVoucherCounters = (counters: Partial<typeof voucherCounters>) => {
  voucherCounters = { ...voucherCounters, ...counters };
};

/**
 * Get current voucher counters (for debugging)
 */
export const getVoucherCounters = () => ({ ...voucherCounters });