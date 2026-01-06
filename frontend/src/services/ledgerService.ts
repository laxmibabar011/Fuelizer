import apiClient from "./apiClient";
import {
  LedgerAccountDTO,
  JournalEntryDTO,
  JournalEntryWithLinesDTO,
  AccountBalanceDTO,
  LedgerReportDTO,
  LedgerApiResponse,
  AccountFilterParams,
  JournalEntryFilterParams,
  DateRangeFilter,
  VoucherType,
  AccountType
} from "../types/ledger";

class LedgerService {
  private readonly baseUrl = "/api/tenant/ledger";

  // ==================== CHART OF ACCOUNTS MANAGEMENT ====================

  /**
   * Create a new ledger account
   */
  async createAccount(payload: Omit<LedgerAccountDTO, 'id' | 'createdAt' | 'updatedAt'>) {
    return apiClient.post<LedgerApiResponse<LedgerAccountDTO>>(
      `${this.baseUrl}/accounts`,
      payload
    );
  }

  /**
   * Get list of ledger accounts with optional filtering
   */
  async getAccounts(params?: AccountFilterParams) {
    return apiClient.get<LedgerApiResponse<LedgerAccountDTO[]>>(
      `${this.baseUrl}/accounts`,
      { params }
    );
  }

  /**
   * Get a specific ledger account by ID
   */
  async getAccount(id: number) {
    return apiClient.get<LedgerApiResponse<LedgerAccountDTO>>(
      `${this.baseUrl}/accounts/${id}`
    );
  }

  /**
   * Update an existing ledger account
   */
  async updateAccount(id: number, payload: Partial<LedgerAccountDTO>) {
    return apiClient.put<LedgerApiResponse<LedgerAccountDTO>>(
      `${this.baseUrl}/accounts/${id}`,
      payload
    );
  }

  /**
   * Delete a ledger account
   */
  async deleteAccount(id: number) {
    return apiClient.delete<LedgerApiResponse<{ message: string }>>(
      `${this.baseUrl}/accounts/${id}`
    );
  }

  /**
   * Get account balance as of a specific date
   */
  async getAccountBalance(id: number, asOfDate?: string) {
    const params = asOfDate ? { asOfDate } : undefined;
    return apiClient.get<LedgerApiResponse<AccountBalanceDTO>>(
      `${this.baseUrl}/accounts/${id}/balance`,
      { params }
    );
  }

  /**
   * Check account protection status
   */
  async getAccountProtection(id: number) {
    return apiClient.get<LedgerApiResponse<{ 
      isProtected: boolean; 
      restrictions: string[]; 
    }>>(
      `${this.baseUrl}/accounts/${id}/protection`
    );
  }

  // ==================== VOUCHER MANAGEMENT ====================

  /**
   * Create a new journal voucher with entries
   */
  async createVoucher(payload: {
    date: string;
    voucher_type: VoucherType;
    narration?: string;
    reference_number?: string;
    entries: Array<{
      ledger_account_id: number;
      debit_amount?: number;
      credit_amount?: number;
      narration?: string;
    }>;
  }) {
    return apiClient.post<LedgerApiResponse<JournalEntryWithLinesDTO>>(
      `${this.baseUrl}/vouchers`,
      payload
    );
  }

  /**
   * Get list of vouchers with optional filtering
   */
  async getVouchers(params?: JournalEntryFilterParams) {
    return apiClient.get<LedgerApiResponse<JournalEntryWithLinesDTO[]>>(
      `${this.baseUrl}/vouchers`,
      { params }
    );
  }

  /**
   * Get a specific voucher by ID
   */
  async getVoucher(id: number) {
    return apiClient.get<LedgerApiResponse<JournalEntryWithLinesDTO>>(
      `${this.baseUrl}/vouchers/${id}`
    );
  }

  /**
   * Cancel a posted voucher
   */
  async cancelVoucher(id: number) {
    return apiClient.patch<LedgerApiResponse<JournalEntryDTO>>(
      `${this.baseUrl}/vouchers/${id}/cancel`
    );
  }

  /**
   * Validate voucher entries before submission
   */
  async validateVoucher(entries: Array<{
    ledger_account_id: number;
    debit_amount?: number;
    credit_amount?: number;
  }>) {
    return apiClient.post<LedgerApiResponse<{
      isValid: boolean;
      totalDebits: number;
      totalCredits: number;
      isBalanced: boolean;
      errors: string[];
    }>>(
      `${this.baseUrl}/vouchers/validate`,
      { entries }
    );
  }

  // ==================== REPORTING ====================

  /**
   * Get trial balance report
   */
  async getTrialBalance(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return apiClient.get<LedgerApiResponse<{
      accounts: Array<{
        id: number;
        name: string;
        account_type: string;
        debit_balance: number;
        credit_balance: number;
      }>;
      totals: {
        total_debits: number;
        total_credits: number;
      };
    }>>(
      `${this.baseUrl}/reports/trial-balance`,
      { params }
    );
  }

  /**
   * Get profit & loss report
   */
  async getProfitLoss(startDate: string, endDate: string) {
    return apiClient.get<LedgerApiResponse<{
      income: {
        accounts: Array<{
          id: number;
          name: string;
          account_type: string;
          amount: number;
        }>;
        total: number;
      };
      expenses: {
        accounts: Array<{
          id: number;
          name: string;
          account_type: string;
          amount: number;
        }>;
        total: number;
      };
      net_profit: number;
    }>>(
      `${this.baseUrl}/reports/profit-loss`,
      { params: { startDate, endDate } }
    );
  }

  /**
   * Get balance sheet report
   */
  async getBalanceSheet(asOfDate: string) {
    return apiClient.get<LedgerApiResponse<{
      assets: {
        accounts: Array<{
          id: number;
          name: string;
          account_type: string;
          amount: number;
        }>;
        total: number;
      };
      liabilities: {
        accounts: Array<{
          id: number;
          name: string;
          account_type: string;
          amount: number;
        }>;
        total: number;
      };
      equity: {
        accounts: Array<{
          id: number;
          name: string;
          account_type: string;
          amount: number;
        }>;
        total: number;
      };
    }>>(
      `${this.baseUrl}/reports/balance-sheet`,
      { params: { asOfDate } }
    );
  }

  /**
   * Get general ledger report for a specific account
   */
  async getGeneralLedger(accountId: number, startDate: string, endDate: string) {
    return apiClient.get<LedgerApiResponse<{
      account: {
        id: number;
        name: string;
        account_type: string;
        description?: string;
      };
      transactions: Array<{
        id: number;
        date: string;
        voucher_number: string;
        voucher_type: string;
        narration: string;
        debit_amount: number;
        credit_amount: number;
        running_balance: number;
      }>;
      opening_balance: number;
      closing_balance: number;
    }>>(
      `${this.baseUrl}/reports/general-ledger/${accountId}`,
      { params: { startDate, endDate } }
    );
  }

  /**
   * Get cash flow report for a date range
   */
  async getCashFlow(startDate: string, endDate: string) {
    return apiClient.get<LedgerApiResponse<{
      date_from: string;
      date_to: string;
      receipts: Array<{
        date: string;
        voucher_number: string;
        narration: string;
        amount: number;
        entries: any[];
      }>;
      payments: Array<{
        date: string;
        voucher_number: string;
        narration: string;
        amount: number;
        entries: any[];
      }>;
      total_receipts: number;
      total_payments: number;
      net_cash_flow: number;
    }>>(
      `${this.baseUrl}/reports/cash-flow`,
      { params: { dateFrom: startDate, dateTo: endDate } }
    );
  }

  /**
   * Get ledger report for a specific account
   */
  async getLedgerReport(
    accountId: number, 
    dateRange?: DateRangeFilter
  ) {
    const params = dateRange ? dateRange : undefined;
    return apiClient.get<LedgerApiResponse<LedgerReportDTO>>(
      `${this.baseUrl}/accounts/${accountId}/ledger`,
      { params }
    );
  }

  /**
   * Run system integrity check
   */
  async getIntegrityCheck() {
    return apiClient.get<LedgerApiResponse<{
      isValid: boolean;
      checks: Array<{
        name: string;
        passed: boolean;
        message?: string;
      }>;
    }>>(
      `${this.baseUrl}/reports/integrity-check`
    );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get accounts filtered by type
   */
  async getAccountsByType(accountType: AccountType) {
    return this.getAccounts({ account_type: accountType });
  }

  /**
   * Get active accounts only
   */
  async getActiveAccounts() {
    return this.getAccounts({ status: 'active' });
  }

  /**
   * Get vouchers by type
   */
  async getVouchersByType(voucherType: VoucherType) {
    return this.getVouchers({ voucher_type: voucherType });
  }

  /**
   * Get vouchers for a specific date range
   */
  async getVouchersByDateRange(startDate: string, endDate: string) {
    return this.getVouchers({ 
      start_date: startDate, 
      end_date: endDate 
    });
  }

  /**
   * Create a payment voucher (helper method)
   */
  async createPaymentVoucher(payload: {
    date: string;
    narration?: string;
    reference_number?: string;
    entries: Array<{
      ledger_account_id: number;
      debit_amount?: number;
      credit_amount?: number;
      narration?: string;
    }>;
  }) {
    return this.createVoucher({
      ...payload,
      voucher_type: 'Payment'
    });
  }

  /**
   * Create a receipt voucher (helper method)
   */
  async createReceiptVoucher(payload: {
    date: string;
    narration?: string;
    reference_number?: string;
    entries: Array<{
      ledger_account_id: number;
      debit_amount?: number;
      credit_amount?: number;
      narration?: string;
    }>;
  }) {
    return this.createVoucher({
      ...payload,
      voucher_type: 'Receipt'
    });
  }

  /**
   * Create a journal voucher (helper method)
   */
  async createJournalVoucher(payload: {
    date: string;
    narration?: string;
    reference_number?: string;
    entries: Array<{
      ledger_account_id: number;
      debit_amount?: number;
      credit_amount?: number;
      narration?: string;
    }>;
  }) {
    return this.createVoucher({
      ...payload,
      voucher_type: 'Journal'
    });
  }
}

export default new LedgerService();

// ================== ERROR HANDLING UTILITIES ====================

/**
 * Error handling utility for ledger operations
 */
export class LedgerError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'LedgerError';
  }
}

/**
 * Handle API errors and convert to LedgerError
 */
export const handleLedgerError = (error: any): LedgerError => {
  if (error.response) {
    const { status, data } = error.response;
    return new LedgerError(
      data.message || data.error || 'An error occurred',
      data.code,
      status,
      data
    );
  }
  
  if (error.request) {
    return new LedgerError(
      'Network error - please check your connection',
      'NETWORK_ERROR'
    );
  }
  
  return new LedgerError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR'
  );
};

/**
 * Validation utilities for ledger data
 */
export const LedgerValidation = {
  /**
   * Validate account data before submission
   */
  validateAccount: (account: Partial<LedgerAccountDTO>): string[] => {
    const errors: string[] = [];
    
    if (!account.name?.trim()) {
      errors.push('Account name is required');
    }
    
    if (!account.account_type) {
      errors.push('Account type is required');
    }
    
    const validAccountTypes: AccountType[] = [
      'Direct Expense', 'Indirect Expense', 'Asset', 
      'Liability', 'Customer', 'Vendor', 'Bank'
    ];
    
    if (account.account_type && validAccountTypes.indexOf(account.account_type) === -1) {
      errors.push('Invalid account type');
    }
    
    return errors;
  },

  /**
   * Validate voucher entries for double-entry compliance
   */
  validateVoucherEntries: (entries: Array<{
    ledger_account_id: number;
    debit_amount?: number;
    credit_amount?: number;
  }>): { isValid: boolean; errors: string[]; totalDebits: number; totalCredits: number } => {
    const errors: string[] = [];
    let totalDebits = 0;
    let totalCredits = 0;
    
    if (!entries || entries.length === 0) {
      errors.push('At least one entry is required');
      return { isValid: false, errors, totalDebits: 0, totalCredits: 0 };
    }
    
    entries.forEach((entry, index) => {
      if (!entry.ledger_account_id) {
        errors.push(`Entry ${index + 1}: Account is required`);
      }
      
      const hasDebit = entry.debit_amount && entry.debit_amount > 0;
      const hasCredit = entry.credit_amount && entry.credit_amount > 0;
      
      if (!hasDebit && !hasCredit) {
        errors.push(`Entry ${index + 1}: Either debit or credit amount is required`);
      }
      
      if (hasDebit && hasCredit) {
        errors.push(`Entry ${index + 1}: Cannot have both debit and credit amounts`);
      }
      
      if (hasDebit) {
        totalDebits += entry.debit_amount!;
      }
      
      if (hasCredit) {
        totalCredits += entry.credit_amount!;
      }
    });
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push('Total debits must equal total credits');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      totalDebits,
      totalCredits
    };
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  validateDate: (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }
};

/**
 * Formatting utilities for ledger data display
 */
export const LedgerFormatters = {
  /**
   * Format currency amount
   */
  formatCurrency: (amount: number | string, currency = '₹'): string => {
    // Convert to number and handle invalid inputs
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Handle NaN or invalid numbers
    if (isNaN(numAmount)) {
      return `${currency} 0.00`;
    }
    
    return `${currency} ${numAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  /**
   * Format date for display
   */
  formatDate: (date: string): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format account type for display
   */
  formatAccountType: (accountType: AccountType): string => {
    return accountType.replace(/([A-Z])/g, ' $1').trim();
  },

  /**
   * Format voucher type for display
   */
  formatVoucherType: (voucherType: VoucherType): string => {
    return voucherType;
  },

  /**
   * Format balance with proper debit/credit indication
   */
  formatBalance: (balance: number, balanceType: 'debit' | 'credit'): string => {
    const formattedAmount = LedgerFormatters.formatCurrency(Math.abs(balance));
    return `${formattedAmount} ${balanceType === 'debit' ? 'Dr' : 'Cr'}`;
  }
};