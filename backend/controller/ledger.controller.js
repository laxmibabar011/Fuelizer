import { sendResponse } from "../util/response.util.js";
import { LedgerRepository } from "../repository/ledger.repository.js";
import { getTenantDbModels } from "./helper/tenantDb.helper.js";
import { logger } from "../util/logger.util.js";

export default class LedgerController {
  // Helper to get the repository instance for the current tenant
  static async _getRepo(req) {
    const tenantSequelize =
      req.tenantSequelize ||
      (await getTenantDbModels(req.user?.tenantDbName || req.tenant?.db_name))
        .tenantSequelize;
    const repo = new LedgerRepository(tenantSequelize);
    return repo;
  }

  // --- Chart of Accounts Management ---

  /**
   * Create a new ledger account
   * POST /api/tenant/ledger/accounts
   */
  static async createAccount(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);

      // Validate required fields
      const { name, account_type } = req.body;
      if (!name || !account_type) {
        return sendResponse(res, {
          success: false,
          error: "Account name and account_type are required",
          status: 400,
        });
      }

      // Validate account_type
      const validAccountTypes = [
        "Direct Expense",
        "Indirect Expense",
        "Asset",
        "Liability",
        "Customer",
        "Vendor",
        "Bank",
      ];
      if (!validAccountTypes.includes(account_type)) {
        return sendResponse(res, {
          success: false,
          error: `Invalid account_type. Must be one of: ${validAccountTypes.join(
            ", "
          )}`,
          status: 400,
        });
      }

      const account = await repo.createAccount(req.body);
      return sendResponse(res, {
        data: account,
        message: "Ledger account created successfully",
        status: 201,
      });
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        return sendResponse(res, {
          success: false,
          error: "An account with this name already exists",
          status: 409,
        });
      }
      if (err.name === "SequelizeValidationError") {
        return sendResponse(res, {
          success: false,
          error: err.errors.map((e) => e.message).join(", "),
          status: 400,
        });
      }
      logger.error(`[ledger.controller]-[createAccount]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to create account",
        status: 500,
      });
    }
  }

  /**
   * List all ledger accounts with optional filtering
   * GET /api/tenant/ledger/accounts
   */
  static async listAccounts(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const accounts = await repo.listAccounts(req.query);
      return sendResponse(res, { data: accounts });
    } catch (err) {
      logger.error(`[ledger.controller]-[listAccounts]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to fetch accounts",
        status: 500,
      });
    }
  }

  /**
   * Get a specific ledger account by ID
   * GET /api/tenant/ledger/accounts/:id
   */
  static async getAccount(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const account = await repo.getAccountById(req.params.id);

      if (!account) {
        return sendResponse(res, {
          success: false,
          error: "Account not found",
          status: 404,
        });
      }

      return sendResponse(res, { data: account });
    } catch (err) {
      logger.error(`[ledger.controller]-[getAccount]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to fetch account",
        status: 500,
      });
    }
  }

  /**
   * Update a ledger account
   * PUT /api/tenant/ledger/accounts/:id
   */
  static async updateAccount(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);

      // Validate account_type if provided
      if (req.body.account_type) {
        const validAccountTypes = [
          "Direct Expense",
          "Indirect Expense",
          "Asset",
          "Liability",
          "Customer",
          "Vendor",
          "Bank",
        ];
        if (!validAccountTypes.includes(req.body.account_type)) {
          return sendResponse(res, {
            success: false,
            error: `Invalid account_type. Must be one of: ${validAccountTypes.join(
              ", "
            )}`,
            status: 400,
          });
        }
      }

      const updated = await repo.updateAccount(req.params.id, req.body);

      if (!updated) {
        return sendResponse(res, {
          success: false,
          error: "Account not found",
          status: 404,
        });
      }

      return sendResponse(res, {
        data: updated,
        message: "Account updated successfully",
      });
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        return sendResponse(res, {
          success: false,
          error: "An account with this name already exists",
          status: 409,
        });
      }
      if (err.name === "SequelizeValidationError") {
        return sendResponse(res, {
          success: false,
          error: err.errors.map((e) => e.message).join(", "),
          status: 400,
        });
      }
      logger.error(`[ledger.controller]-[updateAccount]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to update account",
        status: 500,
      });
    }
  }

  /**
   * Delete a ledger account
   * DELETE /api/tenant/ledger/accounts/:id
   */
  static async deleteAccount(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const deletedCount = await repo.deleteAccount(req.params.id);

      if (deletedCount === 0) {
        return sendResponse(res, {
          success: false,
          error: "Account not found",
          status: 404,
        });
      }

      return sendResponse(res, {
        message: "Account deleted successfully",
      });
    } catch (err) {
      if (err.message.includes("Cannot delete system account")) {
        return sendResponse(res, {
          success: false,
          error: err.message,
          status: 409,
        });
      }
      if (
        err.message.includes(
          "Cannot delete account with existing journal entries"
        )
      ) {
        return sendResponse(res, {
          success: false,
          error: err.message,
          status: 409,
        });
      }
      logger.error(`[ledger.controller]-[deleteAccount]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to delete account",
        status: 500,
      });
    }
  }

  // --- Voucher Management ---

  /**
   * Create a new journal voucher with entries
   * POST /api/tenant/ledger/vouchers
   */
  static async createVoucher(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const { entries, ...voucherData } = req.body;

      // Validate required fields
      if (!voucherData.date || !voucherData.voucher_type) {
        return sendResponse(res, {
          success: false,
          error: "Date and voucher_type are required",
          status: 400,
        });
      }

      // Validate voucher_type
      const validVoucherTypes = ["Payment", "Receipt", "Journal"];
      if (!validVoucherTypes.includes(voucherData.voucher_type)) {
        return sendResponse(res, {
          success: false,
          error: `Invalid voucher_type. Must be one of: ${validVoucherTypes.join(
            ", "
          )}`,
          status: 400,
        });
      }

      // Validate entries
      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return sendResponse(res, {
          success: false,
          error: "At least one journal entry is required",
          status: 400,
        });
      }

      // Validate each entry
      for (const entry of entries) {
        if (!entry.ledger_account_id) {
          return sendResponse(res, {
            success: false,
            error: "Each entry must have a ledger_account_id",
            status: 400,
          });
        }

        const debitAmount = parseFloat(entry.debit_amount || 0);
        const creditAmount = parseFloat(entry.credit_amount || 0);

        if (debitAmount > 0 && creditAmount > 0) {
          return sendResponse(res, {
            success: false,
            error: "Entry cannot have both debit and credit amounts",
            status: 400,
          });
        }

        if (debitAmount === 0 && creditAmount === 0) {
          return sendResponse(res, {
            success: false,
            error: "Entry must have either debit or credit amount",
            status: 400,
          });
        }
      }

      // Add user ID who is creating this voucher
      voucherData.created_by_id = req.user?.userId;

      // Calculate total amount
      const totalAmount = entries.reduce((sum, entry) => {
        return (
          sum +
          Math.max(
            parseFloat(entry.debit_amount || 0),
            parseFloat(entry.credit_amount || 0)
          )
        );
      }, 0);
      voucherData.total_amount = totalAmount;

      const voucher = await repo.createVoucherWithEntries(voucherData, entries);

      return sendResponse(res, {
        data: voucher,
        message: "Voucher created successfully",
        status: 201,
      });
    } catch (err) {
      if (err.message.includes("Voucher does not balance")) {
        return sendResponse(res, {
          success: false,
          error: err.message,
          status: 400,
        });
      }
      if (err.name === "SequelizeValidationError") {
        return sendResponse(res, {
          success: false,
          error: err.errors.map((e) => e.message).join(", "),
          status: 400,
        });
      }
      logger.error(`[ledger.controller]-[createVoucher]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to create voucher",
        status: 500,
      });
    }
  }

  /**
   * List all vouchers with optional filtering
   * GET /api/tenant/ledger/vouchers
   */
  static async listVouchers(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const vouchers = await repo.listVouchers(req.query);
      return sendResponse(res, { data: vouchers });
    } catch (err) {
      logger.error(`[ledger.controller]-[listVouchers]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to fetch vouchers",
        status: 500,
      });
    }
  }

  /**
   * Get a specific voucher by ID with entries
   * GET /api/tenant/ledger/vouchers/:id
   */
  static async getVoucher(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const voucher = await repo.getVoucherById(req.params.id);

      if (!voucher) {
        return sendResponse(res, {
          success: false,
          error: "Voucher not found",
          status: 404,
        });
      }

      return sendResponse(res, { data: voucher });
    } catch (err) {
      logger.error(`[ledger.controller]-[getVoucher]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to fetch voucher",
        status: 500,
      });
    }
  }

  /**
   * Cancel a voucher
   * PATCH /api/tenant/ledger/vouchers/:id/cancel
   */
  static async cancelVoucher(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const voucher = await repo.cancelVoucher(req.params.id);

      if (!voucher) {
        return sendResponse(res, {
          success: false,
          error: "Voucher not found",
          status: 404,
        });
      }

      return sendResponse(res, {
        data: voucher,
        message: "Voucher cancelled successfully",
      });
    } catch (err) {
      if (err.message.includes("already cancelled")) {
        return sendResponse(res, {
          success: false,
          error: err.message,
          status: 409,
        });
      }
      logger.error(`[ledger.controller]-[cancelVoucher]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to cancel voucher",
        status: 500,
      });
    }
  }

  // --- Reporting Endpoints ---

  /**
   * Get account balance for a specific account
   * GET /api/tenant/ledger/accounts/:id/balance
   */
  static async getAccountBalance(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const { asOfDate } = req.query;

      const balance = await repo.getAccountBalance(req.params.id, asOfDate);
      return sendResponse(res, { data: balance });
    } catch (err) {
      if (err.message.includes("Account not found")) {
        return sendResponse(res, {
          success: false,
          error: err.message,
          status: 404,
        });
      }
      logger.error(`[ledger.controller]-[getAccountBalance]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to fetch account balance",
        status: 500,
      });
    }
  }

  /**
   * Generate trial balance report
   * GET /api/tenant/ledger/reports/trial-balance
   */
  static async getTrialBalance(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const { asOfDate } = req.query;

      const trialBalance = await repo.getTrialBalance(asOfDate);
      return sendResponse(res, { data: trialBalance });
    } catch (err) {
      logger.error(`[ledger.controller]-[getTrialBalance]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to generate trial balance",
        status: 500,
      });
    }
  }

  /**
   * Generate cash flow report
   * GET /api/tenant/ledger/reports/cash-flow
   */
  static async getCashFlow(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const { dateFrom, dateTo } = req.query;

      if (!dateFrom || !dateTo) {
        return sendResponse(res, {
          success: false,
          error: "dateFrom and dateTo parameters are required",
          status: 400,
        });
      }

      const cashFlow = await repo.getCashFlow(dateFrom, dateTo);
      return sendResponse(res, { data: cashFlow });
    } catch (err) {
      logger.error(`[ledger.controller]-[getCashFlow]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to generate cash flow report",
        status: 500,
      });
    }
  }

  /**
   * Generate profit & loss report
   * GET /api/tenant/ledger/reports/profit-loss
   */
  static async getProfitLoss(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return sendResponse(res, {
          success: false,
          error: 'Start date and end date are required',
          status: 400
        });
      }

      const profitLossData = await repo.getProfitLoss(startDate, endDate);
      return sendResponse(res, { data: profitLossData });
    } catch (error) {
      logger.error(`[ledger.controller]-[getProfitLoss]: ${error.message}`);
      return sendResponse(res, {
        success: false,
        error: error.message,
        status: 500
      });
    }
  }

  /**
   * Generate balance sheet report
   * GET /api/tenant/ledger/reports/balance-sheet
   */
  static async getBalanceSheet(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const { asOfDate } = req.query;

      if (!asOfDate) {
        return sendResponse(res, {
          success: false,
          error: 'As of date is required',
          status: 400
        });
      }

      const balanceSheetData = await repo.getBalanceSheet(asOfDate);
      return sendResponse(res, { data: balanceSheetData });
    } catch (error) {
      logger.error(`[ledger.controller]-[getBalanceSheet]: ${error.message}`);
      return sendResponse(res, {
        success: false,
        error: error.message,
        status: 500
      });
    }
  }

  /**
   * Generate general ledger report for specific account
   * GET /api/tenant/ledger/reports/general-ledger/:accountId
   */
  static async getGeneralLedger(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const { accountId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return sendResponse(res, {
          success: false,
          error: 'Start date and end date are required',
          status: 400
        });
      }

      const generalLedgerData = await repo.getGeneralLedger(accountId, startDate, endDate);
      return sendResponse(res, { data: generalLedgerData });
    } catch (error) {
      logger.error(`[ledger.controller]-[getGeneralLedger]: ${error.message}`);
      return sendResponse(res, {
        success: false,
        error: error.message,
        status: 500
      });
    }
  }

  /**
   * Validate voucher balance before posting
   * POST /api/tenant/ledger/vouchers/validate
   */
  static async validateVoucher(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const { entries } = req.body;

      if (!entries || !Array.isArray(entries)) {
        return sendResponse(res, {
          success: false,
          error: "Entries array is required",
          status: 400,
        });
      }

      const validation = await repo.validateVoucherBalance(entries);
      return sendResponse(res, { data: validation });
    } catch (err) {
      logger.error(`[ledger.controller]-[validateVoucher]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to validate voucher",
        status: 500,
      });
    }
  }

  /**
   * Check system-wide account integrity
   * GET /api/tenant/ledger/reports/integrity-check
   */
  static async checkIntegrity(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const integrity = await repo.validateAccountIntegrity();
      return sendResponse(res, { data: integrity });
    } catch (err) {
      logger.error(`[ledger.controller]-[checkIntegrity]: ${err.message}`);
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to check system integrity",
        status: 500,
      });
    }
  }

  /**
   * Check account protection status
   * GET /api/tenant/ledger/accounts/:id/protection
   */
  static async checkAccountProtection(req, res) {
    try {
      const repo = await LedgerController._getRepo(req);
      const protection = await repo.checkAccountProtection(req.params.id);
      return sendResponse(res, { data: protection });
    } catch (err) {
      logger.error(
        `[ledger.controller]-[checkAccountProtection]: ${err.message}`
      );
      return sendResponse(res, {
        success: false,
        error: err.message,
        message: "Failed to check account protection",
        status: 500,
      });
    }
  }
}
