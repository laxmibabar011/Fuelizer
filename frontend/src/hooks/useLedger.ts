import { useState, useCallback } from 'react';
import { 
  ledgerService, 
  LedgerError, 
  handleLedgerError,
  LedgerAccountDTO,
  JournalEntryWithLinesDTO,
  TrialBalanceDTO,
  AccountFilterParams,
  JournalEntryFilterParams
} from '../services';

/**
 * Custom hook for ledger operations with loading states and error handling
 */
export const useLedger = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LedgerError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== ACCOUNT OPERATIONS ====================

  const createAccount = useCallback(async (accountData: Omit<LedgerAccountDTO, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.createAccount(accountData);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccounts = useCallback(async (params?: AccountFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getAccounts(params);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccount = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getAccount(id);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAccount = useCallback(async (id: number, accountData: Partial<LedgerAccountDTO>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.updateAccount(id, accountData);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.deleteAccount(id);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountBalance = useCallback(async (id: number, asOfDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getAccountBalance(id, asOfDate);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== VOUCHER OPERATIONS ====================

  const createVoucher = useCallback(async (voucherData: Parameters<typeof ledgerService.createVoucher>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.createVoucher(voucherData);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVouchers = useCallback(async (params?: JournalEntryFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getVouchers(params);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVoucher = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getVoucher(id);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelVoucher = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.cancelVoucher(id);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateVoucher = useCallback(async (entries: Parameters<typeof ledgerService.validateVoucher>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.validateVoucher(entries);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== REPORTING OPERATIONS ====================

  const getTrialBalance = useCallback(async (asOfDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getTrialBalance(asOfDate);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCashFlowReport = useCallback(async (dateFrom: string, dateTo: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getCashFlowReport(dateFrom, dateTo);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLedgerReport = useCallback(async (accountId: number, dateRange?: { start_date?: string; end_date?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getLedgerReport(accountId, dateRange);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getIntegrityCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getIntegrityCheck();
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== UTILITY OPERATIONS ====================

  const getAccountsByType = useCallback(async (accountType: Parameters<typeof ledgerService.getAccountsByType>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getAccountsByType(accountType);
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActiveAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ledgerService.getActiveAccounts();
      return response.data;
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError);
      throw ledgerError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    clearError,

    // Account operations
    createAccount,
    getAccounts,
    getAccount,
    updateAccount,
    deleteAccount,
    getAccountBalance,

    // Voucher operations
    createVoucher,
    getVouchers,
    getVoucher,
    cancelVoucher,
    validateVoucher,

    // Reporting operations
    getTrialBalance,
    getCashFlowReport,
    getLedgerReport,
    getIntegrityCheck,

    // Utility operations
    getAccountsByType,
    getActiveAccounts,

    // Helper methods for specific voucher types
    createPaymentVoucher: useCallback(async (voucherData: Parameters<typeof ledgerService.createPaymentVoucher>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await ledgerService.createPaymentVoucher(voucherData);
        return response.data;
      } catch (err) {
        const ledgerError = handleLedgerError(err);
        setError(ledgerError);
        throw ledgerError;
      } finally {
        setLoading(false);
      }
    }, []),

    createReceiptVoucher: useCallback(async (voucherData: Parameters<typeof ledgerService.createReceiptVoucher>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await ledgerService.createReceiptVoucher(voucherData);
        return response.data;
      } catch (err) {
        const ledgerError = handleLedgerError(err);
        setError(ledgerError);
        throw ledgerError;
      } finally {
        setLoading(false);
      }
    }, []),

    createJournalVoucher: useCallback(async (voucherData: Parameters<typeof ledgerService.createJournalVoucher>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await ledgerService.createJournalVoucher(voucherData);
        return response.data;
      } catch (err) {
        const ledgerError = handleLedgerError(err);
        setError(ledgerError);
        throw ledgerError;
      } finally {
        setLoading(false);
      }
    }, [])
  };
};

export default useLedger;