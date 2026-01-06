// backend/middleware/ledger.validation.js

import { sendResponse } from '../util/response.util.js';

/**
 * Validation middleware for voucher creation
 * Validates the structure and business rules for journal vouchers
 */
export const validateVoucherCreation = (req, res, next) => {
  try {
    const { entries, date, voucher_type, narration } = req.body;
    
    // Validate required fields
    if (!date) {
      return sendResponse(res, { 
        success: false, 
        error: 'Date is required', 
        message: 'Validation error',
        status: 400 
      });
    }

    if (!voucher_type) {
      return sendResponse(res, { 
        success: false, 
        error: 'Voucher type is required', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate voucher_type
    const validVoucherTypes = ['Payment', 'Receipt', 'Journal'];
    if (!validVoucherTypes.includes(voucher_type)) {
      return sendResponse(res, { 
        success: false, 
        error: `Invalid voucher_type. Must be one of: ${validVoucherTypes.join(', ')}`, 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return sendResponse(res, { 
        success: false, 
        error: 'Date must be in YYYY-MM-DD format', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate date is not in future
    const voucherDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (voucherDate > today) {
      return sendResponse(res, { 
        success: false, 
        error: 'Voucher date cannot be in the future', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate entries array
    if (!entries || !Array.isArray(entries)) {
      return sendResponse(res, { 
        success: false, 
        error: 'Entries must be an array', 
        message: 'Validation error',
        status: 400 
      });
    }

    if (entries.length === 0) {
      return sendResponse(res, { 
        success: false, 
        error: 'At least one journal entry is required', 
        message: 'Validation error',
        status: 400 
      });
    }

    if (entries.length < 2) {
      return sendResponse(res, { 
        success: false, 
        error: 'At least two journal entries are required for double-entry accounting', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate each entry
    let totalDebits = 0;
    let totalCredits = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      // Validate required fields for each entry
      if (!entry.ledger_account_id) {
        return sendResponse(res, { 
          success: false, 
          error: `Entry ${i + 1}: ledger_account_id is required`, 
          message: 'Validation error',
          status: 400 
        });
      }

      // Validate account ID is a positive integer
      const accountId = parseInt(entry.ledger_account_id);
      if (isNaN(accountId) || accountId <= 0) {
        return sendResponse(res, { 
          success: false, 
          error: `Entry ${i + 1}: ledger_account_id must be a positive integer`, 
          message: 'Validation error',
          status: 400 
        });
      }

      // Parse and validate amounts
      const debitAmount = parseFloat(entry.debit_amount || 0);
      const creditAmount = parseFloat(entry.credit_amount || 0);

      // Validate amounts are non-negative
      if (debitAmount < 0 || creditAmount < 0) {
        return sendResponse(res, { 
          success: false, 
          error: `Entry ${i + 1}: amounts cannot be negative`, 
          message: 'Validation error',
          status: 400 
        });
      }

      // Validate that entry has either debit OR credit (not both, not neither)
      if (debitAmount > 0 && creditAmount > 0) {
        return sendResponse(res, { 
          success: false, 
          error: `Entry ${i + 1}: cannot have both debit and credit amounts`, 
          message: 'Validation error',
          status: 400 
        });
      }

      if (debitAmount === 0 && creditAmount === 0) {
        return sendResponse(res, { 
          success: false, 
          error: `Entry ${i + 1}: must have either debit or credit amount`, 
          message: 'Validation error',
          status: 400 
        });
      }

      // Validate amount precision (max 2 decimal places)
      if (!isValidDecimalPrecision(debitAmount, 2) || !isValidDecimalPrecision(creditAmount, 2)) {
        return sendResponse(res, { 
          success: false, 
          error: `Entry ${i + 1}: amounts can have maximum 2 decimal places`, 
          message: 'Validation error',
          status: 400 
        });
      }

      // Accumulate totals for balance validation
      totalDebits += debitAmount;
      totalCredits += creditAmount;

      // Normalize the entry amounts to ensure consistency
      entry.debit_amount = debitAmount;
      entry.credit_amount = creditAmount;
      entry.ledger_account_id = accountId;
    }

    // Validate double-entry balance (debits must equal credits)
    const tolerance = 0.01; // Allow for minor floating point differences
    if (Math.abs(totalDebits - totalCredits) > tolerance) {
      return sendResponse(res, { 
        success: false, 
        error: `Voucher does not balance: debits ₹${totalDebits.toFixed(2)}, credits ₹${totalCredits.toFixed(2)}`, 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate narration length if provided
    if (narration && narration.length > 500) {
      return sendResponse(res, { 
        success: false, 
        error: 'Narration cannot exceed 500 characters', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Add calculated total amount to request body
    req.body.total_amount = totalDebits; // or totalCredits, they should be equal

    next();
  } catch (err) {
    return sendResponse(res, { 
      success: false, 
      error: 'Invalid request format', 
      message: 'Validation error',
      status: 400 
    });
  }
};

/**
 * Validation middleware for account creation
 */
export const validateAccountCreation = (req, res, next) => {
  try {
    const { name, account_type, status } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return sendResponse(res, { 
        success: false, 
        error: 'Account name is required and must be a non-empty string', 
        message: 'Validation error',
        status: 400 
      });
    }

    if (!account_type) {
      return sendResponse(res, { 
        success: false, 
        error: 'Account type is required', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate account_type
    const validAccountTypes = ['Direct Expense', 'Indirect Expense', 'Asset', 'Liability', 'Customer', 'Vendor', 'Bank'];
    if (!validAccountTypes.includes(account_type)) {
      return sendResponse(res, { 
        success: false, 
        error: `Invalid account_type. Must be one of: ${validAccountTypes.join(', ')}`, 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      return sendResponse(res, { 
        success: false, 
        error: 'Status must be either "active" or "inactive"', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate name length
    if (name.trim().length > 100) {
      return sendResponse(res, { 
        success: false, 
        error: 'Account name cannot exceed 100 characters', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Normalize the name (trim whitespace)
    req.body.name = name.trim();

    next();
  } catch (err) {
    return sendResponse(res, { 
      success: false, 
      error: 'Invalid request format', 
      message: 'Validation error',
      status: 400 
    });
  }
};

/**
 * Validation middleware for account updates
 */
export const validateAccountUpdate = (req, res, next) => {
  try {
    const { name, account_type, status } = req.body;
    
    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return sendResponse(res, { 
          success: false, 
          error: 'Account name must be a non-empty string', 
          message: 'Validation error',
          status: 400 
        });
      }

      if (name.trim().length > 100) {
        return sendResponse(res, { 
          success: false, 
          error: 'Account name cannot exceed 100 characters', 
          message: 'Validation error',
          status: 400 
        });
      }

      // Normalize the name
      req.body.name = name.trim();
    }

    // Validate account_type if provided
    if (account_type !== undefined) {
      const validAccountTypes = ['Direct Expense', 'Indirect Expense', 'Asset', 'Liability', 'Customer', 'Vendor', 'Bank'];
      if (!validAccountTypes.includes(account_type)) {
        return sendResponse(res, { 
          success: false, 
          error: `Invalid account_type. Must be one of: ${validAccountTypes.join(', ')}`, 
          message: 'Validation error',
          status: 400 
        });
      }
    }

    // Validate status if provided
    if (status !== undefined && !['active', 'inactive'].includes(status)) {
      return sendResponse(res, { 
        success: false, 
        error: 'Status must be either "active" or "inactive"', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Prevent modification of system account flag
    if (req.body.is_system_account !== undefined) {
      return sendResponse(res, { 
        success: false, 
        error: 'Cannot modify system account flag', 
        message: 'Validation error',
        status: 400 
      });
    }

    next();
  } catch (err) {
    return sendResponse(res, { 
      success: false, 
      error: 'Invalid request format', 
      message: 'Validation error',
      status: 400 
    });
  }
};

/**
 * Validation middleware for date range queries
 */
export const validateDateRange = (req, res, next) => {
  try {
    const { dateFrom, dateTo, asOfDate } = req.query;
    
    // Validate date format helper
    const isValidDate = (dateString) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) return false;
      
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date);
    };

    // Validate dateFrom if provided
    if (dateFrom && !isValidDate(dateFrom)) {
      return sendResponse(res, { 
        success: false, 
        error: 'dateFrom must be in YYYY-MM-DD format', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate dateTo if provided
    if (dateTo && !isValidDate(dateTo)) {
      return sendResponse(res, { 
        success: false, 
        error: 'dateTo must be in YYYY-MM-DD format', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate asOfDate if provided
    if (asOfDate && !isValidDate(asOfDate)) {
      return sendResponse(res, { 
        success: false, 
        error: 'asOfDate must be in YYYY-MM-DD format', 
        message: 'Validation error',
        status: 400 
      });
    }

    // Validate date range logic
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      if (fromDate > toDate) {
        return sendResponse(res, { 
          success: false, 
          error: 'dateFrom cannot be later than dateTo', 
          message: 'Validation error',
          status: 400 
        });
      }
    }

    next();
  } catch (err) {
    return sendResponse(res, { 
      success: false, 
      error: 'Invalid date format', 
      message: 'Validation error',
      status: 400 
    });
  }
};

/**
 * Helper function to validate decimal precision
 */
function isValidDecimalPrecision(number, maxDecimals) {
  if (number === 0) return true;
  
  const decimalPart = number.toString().split('.')[1];
  return !decimalPart || decimalPart.length <= maxDecimals;
}