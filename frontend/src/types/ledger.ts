// Ledger module types and interfaces

export type AccountType = 
  | 'Direct Expense' 
  | 'Indirect Expense' 
  | 'Asset' 
  | 'Liability' 
  | 'Customer' 
  | 'Vendor' 
  | 'Bank';

export type VoucherType = 'Payment' | 'Receipt' | 'Journal';

export type AccountStatus = 'active' | 'inactive';

export type VoucherStatus = 'Posted' | 'Cancelled';

// Base interface for ledger entities
export interface BaseLedgerEntity {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Ledger Account DTO
export interface LedgerAccountDTO extends BaseLedgerEntity {
  name: string;
  account_type: AccountType;
  is_system_account?: boolean;
  status?: AccountStatus;
}

// Journal Entry DTO
export interface JournalEntryDTO extends BaseLedgerEntity {
  voucher_number: string;
  voucher_type: VoucherType;
  voucher_date: string;
  reference_number?: string;
  description?: string;
  total_amount: number;
  status?: VoucherStatus;
}

// Journal Entry Line DTO
export interface JournalEntryLineDTO extends BaseLedgerEntity {
  journal_entry_id: number;
  account_id: number;
  debit_amount?: number;
  credit_amount?: number;
  description?: string;
}

// Complete Journal Entry with Lines
export interface JournalEntryWithLinesDTO extends JournalEntryDTO {
  lines: JournalEntryLineDTO[];
}

// Account Balance DTO
export interface AccountBalanceDTO {
  account_id: number;
  account_name: string;
  account_type: AccountType;
  balance: number;
  balance_type: 'debit' | 'credit';
}

// Trial Balance DTO
export interface TrialBalanceDTO {
  accounts: AccountBalanceDTO[];
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
}

// Ledger Report DTO
export interface LedgerReportDTO {
  account_id: number;
  account_name: string;
  account_type: AccountType;
  opening_balance: number;
  total_debits: number;
  total_credits: number;
  closing_balance: number;
  transactions: LedgerTransactionDTO[];
}

// Ledger Transaction DTO
export interface LedgerTransactionDTO {
  date: string;
  voucher_number: string;
  voucher_type: VoucherType;
  description: string;
  debit_amount?: number;
  credit_amount?: number;
  balance: number;
}

// API Response wrapper
export interface LedgerApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Pagination interface
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Date range filter
export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

// Account filter params
export interface AccountFilterParams extends PaginationParams {
  account_type?: AccountType;
  status?: AccountStatus;
  search?: string;
}

// Journal Entry filter params
export interface JournalEntryFilterParams extends PaginationParams, DateRangeFilter {
  voucher_type?: VoucherType;
  status?: VoucherStatus;
  search?: string;
}