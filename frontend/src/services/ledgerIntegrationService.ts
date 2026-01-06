// frontend/src/services/ledgerIntegrationService.ts

import apiClient from "./apiClient";

export interface IntegrationSettings {
  purchaseAutoEntries: boolean;
  salesAutoEntries: boolean;
  customerPaymentAutoEntries: boolean;
  defaultExpenseAccountId?: number;
  defaultRevenueAccountId?: number;
  defaultCashAccountId?: number;
  defaultBankAccountId?: number;
}

export interface PurchaseJournalOptions {
  autoCreateEntries?: boolean;
  expenseAccountId?: number;
  vendorAccountId?: number;
  inventoryAccountId?: number;
  gstAccountId?: number;
  narration?: string;
}

export interface SalesJournalOptions {
  autoCreateEntries?: boolean;
  revenueAccountId?: number;
  customerAccountId?: number;
  cashAccountId?: number;
  bankAccountId?: number;
  narration?: string;
}

export interface CustomerPaymentOptions {
  autoCreateEntries?: boolean;
  customerAccountId?: number;
  cashAccountId?: number;
  bankAccountId?: number;
  narration?: string;
}

export interface LedgerAccount {
  id: number;
  name: string;
  account_type: string;
  status: string;
}

const LedgerIntegrationService = {
  // Purchase Integration
  createPurchaseJournalEntries: (
    purchaseId: number,
    options: PurchaseJournalOptions = {}
  ) =>
    apiClient.post(`/api/tenant/ledger/integration/purchase/${purchaseId}`, {
      options,
    }),

  // Sales Integration
  createSalesJournalEntries: (
    sales: any[],
    options: SalesJournalOptions = {}
  ) =>
    apiClient.post("/api/tenant/ledger/integration/sales", { sales, options }),

  // Customer Payment Integration
  createCustomerPaymentJournalEntries: (
    payment: any,
    options: CustomerPaymentOptions = {}
  ) =>
    apiClient.post("/api/tenant/ledger/integration/customer-payment", {
      payment,
      options,
    }),

  // Settings Management
  getIntegrationSettings: () =>
    apiClient.get("/api/tenant/ledger/integration/settings"),

  updateIntegrationSettings: (settings: IntegrationSettings) =>
    apiClient.put("/api/tenant/ledger/integration/settings", settings),

  // Account Management
  getAvailableAccounts: (accountType?: string) =>
    apiClient.get("/api/tenant/ledger/integration/accounts", {
      params: accountType ? { account_type: accountType } : {},
    }),

  // Testing
  testIntegration: (
    testType: "purchase" | "sales" | "customer_payment",
    testData: any
  ) =>
    apiClient.post("/api/tenant/ledger/integration/test", {
      testType,
      testData,
    }),

  // Purchase-specific methods
  createPurchaseJournalEntriesFromPurchase: (
    purchaseId: number,
    options: PurchaseJournalOptions = {}
  ) =>
    apiClient.post(
      `/api/tenant/purchase/${purchaseId}/create-journal-entries`,
      {
        options,
      }
    ),

  getPurchaseIntegrationSettings: () =>
    apiClient.get("/api/tenant/purchase/integration-settings"),

  // Sales-specific methods
  createSalesJournalEntriesFromSales: (
    sales: any[],
    options: SalesJournalOptions = {}
  ) =>
    apiClient.post("/api/tenant/sales/create-journal-entries", {
      sales,
      options,
    }),

  createCustomerPaymentFromSales: (
    payment: any,
    options: CustomerPaymentOptions = {}
  ) =>
    apiClient.post("/api/tenant/sales/customer-payment", { payment, options }),

  getSalesIntegrationSettings: () =>
    apiClient.get("/api/tenant/sales/integration-settings"),
};

export default LedgerIntegrationService;
