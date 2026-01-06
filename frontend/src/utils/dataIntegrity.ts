/**
 * Data Integrity and Validation System
 */

import { LedgerAccountDTO, JournalEntryDTO, JournalEntryWithLinesDTO } from '../types/ledger';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 integrity score
}

export interface ValidationError {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: ValidationCategory;
  field?: string;
  message: string;
  suggestion?: string;
  affectedRecords?: string[];
}

export interface ValidationWarning {
  id: string;
  category: ValidationCategory;
  message: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
}

export type ValidationCategory = 
  | 'BALANCE_MISMATCH'
  | 'DUPLICATE_DATA'
  | 'MISSING_REQUIRED'
  | 'INVALID_FORMAT'
  | 'BUSINESS_RULE'
  | 'REFERENTIAL_INTEGRITY'
  | 'ACCOUNTING_PRINCIPLE'
  | 'DATA_CONSISTENCY';

export interface IntegrityCheckOptions {
  checkBalances?: boolean;
  checkDuplicates?: boolean;
  checkReferences?: boolean;
  checkBusinessRules?: boolean;
  checkAccountingPrinciples?: boolean;
  includeWarnings?: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Data Integrity Service
 */
export class DataIntegrityService {
  private static instance: DataIntegrityService;

  static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  /**
   * Comprehensive data integrity check
   */
  async performIntegrityCheck(
    accounts: LedgerAccountDTO[],
    vouchers: JournalEntryWithLinesDTO[],
    journalEntries: JournalEntryDTO[],
    options: IntegrityCheckOptions = {}
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Default options
    const opts = {
      checkBalances: true,
      checkDuplicates: true,
      checkReferences: true,
      checkBusinessRules: true,
      checkAccountingPrinciples: true,
      includeWarnings: true,
      ...options
    };

    try {
      // Extract journal entry lines from vouchers for detailed analysis
      const journalEntryLines = vouchers.flatMap(voucher => 
        voucher.lines?.map(line => ({
          ...line,
          voucher_id: voucher.id,
          voucher_number: voucher.voucher_number,
          voucher_date: voucher.voucher_date
        })) || []
      );

      // 1. Check trial balance
      if (opts.checkBalances) {
        const balanceResults = await this.checkTrialBalance(journalEntryLines);
        errors.push(...balanceResults.errors);
        if (opts.includeWarnings) warnings.push(...balanceResults.warnings);
      }

      // 2. Check for duplicates
      if (opts.checkDuplicates) {
        const duplicateResults = await this.checkDuplicates(accounts, vouchers);
        errors.push(...duplicateResults.errors);
        if (opts.includeWarnings) warnings.push(...duplicateResults.warnings);
      }

      // 3. Check referential integrity
      if (opts.checkReferences) {
        const refResults = await this.checkReferentialIntegrity(accounts, vouchers, journalEntryLines);
        errors.push(...refResults.errors);
        if (opts.includeWarnings) warnings.push(...refResults.warnings);
      }

      // 4. Check business rules
      if (opts.checkBusinessRules) {
        const businessResults = await this.checkBusinessRules(accounts, vouchers, journalEntryLines);
        errors.push(...businessResults.errors);
        if (opts.includeWarnings) warnings.push(...businessResults.warnings);
      }

      // 5. Check accounting principles
      if (opts.checkAccountingPrinciples) {
        const principleResults = await this.checkAccountingPrinciples(accounts, journalEntryLines);
        errors.push(...principleResults.errors);
        if (opts.includeWarnings) warnings.push(...principleResults.warnings);
      }

      // Calculate integrity score
      const score = this.calculateIntegrityScore(errors, warnings);

      return {
        isValid: errors.filter(e => e.severity === 'error').length === 0,
        errors,
        warnings,
        score
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          id: 'SYSTEM_ERROR',
          severity: 'error',
          category: 'DATA_CONSISTENCY',
          message: `System error during integrity check: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Please contact system administrator'
        }],
        warnings: [],
        score: 0
      };
    }
  }

  /**
   * Check trial balance integrity
   */
  private async checkTrialBalance(journalEntryLines: any[]): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Group entries by voucher
    const voucherGroups = this.groupBy(journalEntryLines, 'voucher_id');

    Object.entries(voucherGroups).forEach(([voucherId, entries]) => {
      const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
      const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);

      const difference = Math.abs(totalDebits - totalCredits);
      
      if (difference > 0.01) { // Allow for minor rounding differences
        errors.push({
          id: `BALANCE_MISMATCH_${voucherId}`,
          severity: 'error',
          category: 'BALANCE_MISMATCH',
          message: `Voucher ${voucherId} is not balanced. Debits: ₹${totalDebits.toFixed(2)}, Credits: ₹${totalCredits.toFixed(2)}, Difference: ₹${difference.toFixed(2)}`,
          suggestion: 'Review and correct the journal entries to ensure debits equal credits',
          affectedRecords: [voucherId]
        });
      }
    });

    // Check overall trial balance
    const totalDebits = journalEntryLines.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
    const totalCredits = journalEntryLines.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);
    const overallDifference = Math.abs(totalDebits - totalCredits);

    if (overallDifference > 0.01) {
      errors.push({
        id: 'OVERALL_BALANCE_MISMATCH',
        severity: 'error',
        category: 'BALANCE_MISMATCH',
        message: `Overall trial balance is not balanced. Total Debits: ₹${totalDebits.toFixed(2)}, Total Credits: ₹${totalCredits.toFixed(2)}, Difference: ₹${overallDifference.toFixed(2)}`,
        suggestion: 'Review all journal entries to identify and correct imbalances'
      });
    }

    return { errors, warnings };
  }

  /**
   * Check for duplicate records
   */
  private async checkDuplicates(accounts: LedgerAccountDTO[], vouchers: JournalEntryWithLinesDTO[]): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check duplicate account names
    const accountNames = accounts.map(acc => acc.name.toLowerCase());
    const duplicateAccountNames = accountNames.filter((name, index) => accountNames.indexOf(name) !== index);
    
    if (duplicateAccountNames.length > 0) {
      errors.push({
        id: 'DUPLICATE_ACCOUNT_NAMES',
        severity: 'error',
        category: 'DUPLICATE_DATA',
        message: `Found duplicate account names: ${[...new Set(duplicateAccountNames)].join(', ')}`,
        suggestion: 'Rename duplicate accounts to ensure unique account names'
      });
    }

    // Note: Account codes are not part of the current schema, skipping duplicate code check

    // Check duplicate voucher numbers
    const voucherNumbers = vouchers.map(v => v.voucher_number.toLowerCase());
    const duplicateVoucherNumbers = voucherNumbers.filter((num, index) => voucherNumbers.indexOf(num) !== index);
    
    if (duplicateVoucherNumbers.length > 0) {
      errors.push({
        id: 'DUPLICATE_VOUCHER_NUMBERS',
        severity: 'error',
        category: 'DUPLICATE_DATA',
        message: `Found duplicate voucher numbers: ${[...new Set(duplicateVoucherNumbers)].join(', ')}`,
        suggestion: 'Ensure all voucher numbers are unique'
      });
    }

    return { errors, warnings };
  }

  /**
   * Check referential integrity
   */
  private async checkReferentialIntegrity(
    accounts: LedgerAccountDTO[],
    vouchers: JournalEntryWithLinesDTO[],
    journalEntryLines: any[]
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const accountIds = new Set(accounts.map(acc => acc.id));
    const voucherIds = new Set(vouchers.map(v => v.id));

    // Check journal entries reference valid accounts
    journalEntryLines.forEach(entry => {
      if (entry.account_id && !accountIds.has(entry.account_id)) {
        errors.push({
          id: `INVALID_ACCOUNT_REF_${entry.id}`,
          severity: 'error',
          category: 'REFERENTIAL_INTEGRITY',
          message: `Journal entry ${entry.id} references non-existent account ID: ${entry.account_id}`,
          suggestion: 'Update the journal entry to reference a valid account or create the missing account'
        });
      }

      if (entry.voucher_id && !voucherIds.has(entry.voucher_id)) {
        errors.push({
          id: `INVALID_VOUCHER_REF_${entry.id}`,
          severity: 'error',
          category: 'REFERENTIAL_INTEGRITY',
          message: `Journal entry ${entry.id} references non-existent voucher ID: ${entry.voucher_id}`,
          suggestion: 'Update the journal entry to reference a valid voucher or create the missing voucher'
        });
      }
    });

    // Check for orphaned journal entries
    const entriesWithoutVouchers = journalEntryLines.filter(entry => !entry.voucher_id);
    if (entriesWithoutVouchers.length > 0) {
      warnings.push({
        id: 'ORPHANED_JOURNAL_ENTRIES',
        category: 'REFERENTIAL_INTEGRITY',
        message: `Found ${entriesWithoutVouchers.length} journal entries without voucher references`,
        suggestion: 'Link these entries to appropriate vouchers or remove if no longer needed',
        impact: 'medium'
      });
    }

    return { errors, warnings };
  }

  /**
   * Check business rules
   */
  private async checkBusinessRules(
    accounts: LedgerAccountDTO[],
    vouchers: JournalEntryWithLinesDTO[],
    journalEntryLines: any[]
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Rule 1: Asset accounts should have debit balances
    const assetAccounts = accounts.filter(acc => acc.account_type === 'Asset');
    assetAccounts.forEach(account => {
      const accountEntries = journalEntryLines.filter(entry => entry.account_id === account.id);
      const balance = this.calculateAccountBalance(accountEntries);
      
      if (balance < 0) {
        warnings.push({
          id: `NEGATIVE_ASSET_BALANCE_${account.id}`,
          category: 'BUSINESS_RULE',
          message: `Asset account "${account.name}" has a negative balance: ₹${balance.toFixed(2)}`,
          suggestion: 'Review transactions for this asset account as negative balances are unusual',
          impact: 'medium'
        });
      }
    });

    // Rule 2: Liability accounts should have credit balances
    const liabilityAccounts = accounts.filter(acc => acc.account_type === 'Liability');
    liabilityAccounts.forEach(account => {
      const accountEntries = journalEntryLines.filter(entry => entry.account_id === account.id);
      const balance = this.calculateAccountBalance(accountEntries);
      
      if (balance > 0) {
        warnings.push({
          id: `POSITIVE_LIABILITY_BALANCE_${account.id}`,
          category: 'BUSINESS_RULE',
          message: `Liability account "${account.name}" has a positive balance: ₹${balance.toFixed(2)}`,
          suggestion: 'Review transactions for this liability account as positive balances are unusual',
          impact: 'medium'
        });
      }
    });

    // Rule 3: Check for unusually large transactions
    const largeTransactionThreshold = 100000; // ₹1 lakh
    journalEntryLines.forEach(entry => {
      const amount = Math.max(entry.debit_amount || 0, entry.credit_amount || 0);
      if (amount > largeTransactionThreshold) {
        warnings.push({
          id: `LARGE_TRANSACTION_${entry.id}`,
          category: 'BUSINESS_RULE',
          message: `Large transaction detected: ₹${amount.toFixed(2)} in journal entry ${entry.id}`,
          suggestion: 'Verify this large transaction is correct and properly authorized',
          impact: 'high'
        });
      }
    });

    // Rule 4: Check for future-dated transactions
    const today = new Date();
    vouchers.forEach(voucher => {
      if (voucher.voucher_date && new Date(voucher.voucher_date) > today) {
        warnings.push({
          id: `FUTURE_DATED_VOUCHER_${voucher.id}`,
          category: 'BUSINESS_RULE',
          message: `Future-dated voucher: ${voucher.voucher_number} dated ${voucher.voucher_date}`,
          suggestion: 'Verify the voucher date is correct',
          impact: 'low'
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Check accounting principles
   */
  private async checkAccountingPrinciples(
    accounts: LedgerAccountDTO[],
    journalEntryLines: any[]
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Principle 1: Every debit must have a corresponding credit
    // (Already checked in trial balance)

    // Principle 2: Check for accounts with no activity
    const activeAccountIds = new Set(journalEntryLines.map(entry => entry.account_id));
    const inactiveAccounts = accounts.filter(acc => !activeAccountIds.has(acc.id));
    
    if (inactiveAccounts.length > 0) {
      warnings.push({
        id: 'INACTIVE_ACCOUNTS',
        category: 'ACCOUNTING_PRINCIPLE',
        message: `Found ${inactiveAccounts.length} accounts with no transactions`,
        suggestion: 'Consider archiving unused accounts to keep the chart of accounts clean',
        impact: 'low'
      });
    }

    // Principle 3: Check for missing narrations
    const entriesWithoutNarration = journalEntries.filter(entry => !entry.narration || entry.narration.trim() === '');
    if (entriesWithoutNarration.length > 0) {
      warnings.push({
        id: 'MISSING_NARRATIONS',
        category: 'ACCOUNTING_PRINCIPLE',
        message: `Found ${entriesWithoutNarration.length} journal entries without narration`,
        suggestion: 'Add descriptive narrations to all journal entries for better audit trail',
        impact: 'medium'
      });
    }

    return { errors, warnings };
  }

  /**
   * Calculate integrity score (0-100)
   */
  private calculateIntegrityScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 100;

    // Deduct points for errors
    errors.forEach(error => {
      switch (error.severity) {
        case 'error':
          score -= 10;
          break;
        case 'warning':
          score -= 3;
          break;
        case 'info':
          score -= 1;
          break;
      }
    });

    // Deduct points for warnings
    warnings.forEach(warning => {
      switch (warning.impact) {
        case 'high':
          score -= 5;
          break;
        case 'medium':
          score -= 2;
          break;
        case 'low':
          score -= 1;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate account balance
   */
  private calculateAccountBalance(entries: JournalEntryDTO[]): number {
    const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
    const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);
    return totalDebits - totalCredits;
  }

  /**
   * Group array by key
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Quick validation for single records
   */
  validateAccount(account: Partial<LedgerAccountDTO>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!account.name?.trim()) {
      errors.push({
        id: 'MISSING_ACCOUNT_NAME',
        severity: 'error',
        category: 'MISSING_REQUIRED',
        field: 'account_name',
        message: 'Account name is required',
        suggestion: 'Enter a descriptive account name'
      });
    }

    if (!account.account_type) {
      errors.push({
        id: 'MISSING_ACCOUNT_TYPE',
        severity: 'error',
        category: 'MISSING_REQUIRED',
        field: 'account_type',
        message: 'Account type is required',
        suggestion: 'Select an appropriate account type'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: errors.length === 0 ? 100 : 50
    };
  }

  validateVoucher(voucher: Partial<JournalEntryDTO>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!voucher.voucher_number?.trim()) {
      errors.push({
        id: 'MISSING_VOUCHER_NUMBER',
        severity: 'error',
        category: 'MISSING_REQUIRED',
        field: 'voucher_number',
        message: 'Voucher number is required',
        suggestion: 'Enter a unique voucher number'
      });
    }

    if (!voucher.voucher_type) {
      errors.push({
        id: 'MISSING_VOUCHER_TYPE',
        severity: 'error',
        category: 'MISSING_REQUIRED',
        field: 'voucher_type',
        message: 'Voucher type is required',
        suggestion: 'Select Payment, Receipt, or Journal'
      });
    }

    if (!voucher.voucher_date) {
      errors.push({
        id: 'MISSING_VOUCHER_DATE',
        severity: 'error',
        category: 'MISSING_REQUIRED',
        field: 'voucher_date',
        message: 'Voucher date is required',
        suggestion: 'Enter the transaction date'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: errors.length === 0 ? 100 : 50
    };
  }
}

// Export singleton instance
export const dataIntegrity = DataIntegrityService.getInstance();