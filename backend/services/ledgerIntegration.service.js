// backend/services/ledgerIntegration.service.js

import { LedgerRepository } from '../repository/ledger.repository.js';
import { logger } from '../util/logger.util.js';

/**
 * LedgerIntegrationService handles integration between General Ledger and other modules
 * Provides hooks for automatic journal entry creation and account linking
 */
export class LedgerIntegrationService {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.ledgerRepo = new LedgerRepository(sequelize);
  }

  /**
   * Create journal entries for purchase transactions
   * @param {Object} purchase - Purchase object with items
   * @param {Object} options - Integration options
   * @returns {Object} Created journal voucher
   */
  async createPurchaseJournalEntries(purchase, options = {}) {
    try {
      const {
        autoCreateEntries = true,
        expenseAccountId = null,
        vendorAccountId = null,
        inventoryAccountId = null,
        gstAccountId = null,
        narration = null
      } = options;

      if (!autoCreateEntries) {
        logger.info('Auto-creation disabled for purchase journal entries');
        return null;
      }

      // Get or create vendor account
      const vendorAccount = await this.getOrCreateVendorAccount(purchase.vendor_id, purchase.Vendor);
      
      // Get or create expense account for purchases
      const expenseAccount = expenseAccountId 
        ? await this.ledgerRepo.getAccountById(expenseAccountId)
        : await this.getOrCreateAccount('Purchase Expenses', 'Direct Expense');

      // Get or create inventory account
      const inventoryAccount = inventoryAccountId
        ? await this.ledgerRepo.getAccountById(inventoryAccountId)
        : await this.getOrCreateAccount('Inventory', 'Asset');

      // Get or create GST accounts
      const cgstAccount = await this.getOrCreateAccount('CGST Payable', 'Liability');
      const sgstAccount = await this.getOrCreateAccount('SGST Payable', 'Liability');
      const igstAccount = await this.getOrCreateAccount('IGST Payable', 'Liability');

      // Calculate totals
      const totalAmount = parseFloat(purchase.total_amount);
      const cgstAmount = parseFloat(purchase.cgst_amount || 0);
      const sgstAmount = parseFloat(purchase.sgst_amount || 0);
      const igstAmount = parseFloat(purchase.igst_amount || 0);
      const taxableAmount = totalAmount - cgstAmount - sgstAmount - igstAmount;

      // Create journal entries
      const entries = [];

      // Debit: Inventory/Expense Account
      entries.push({
        ledger_account_id: inventoryAccount.id,
        debit_amount: taxableAmount,
        credit_amount: 0,
        narration: `Purchase from ${purchase.Vendor?.name || 'Vendor'} - ${purchase.invoice_number}`
      });

      // Debit: GST Accounts (if applicable)
      if (cgstAmount > 0) {
        entries.push({
          ledger_account_id: cgstAccount.id,
          debit_amount: cgstAmount,
          credit_amount: 0,
          narration: `CGST on purchase - ${purchase.invoice_number}`
        });
      }

      if (sgstAmount > 0) {
        entries.push({
          ledger_account_id: sgstAccount.id,
          debit_amount: sgstAmount,
          credit_amount: 0,
          narration: `SGST on purchase - ${purchase.invoice_number}`
        });
      }

      if (igstAmount > 0) {
        entries.push({
          ledger_account_id: igstAccount.id,
          debit_amount: igstAmount,
          credit_amount: 0,
          narration: `IGST on purchase - ${purchase.invoice_number}`
        });
      }

      // Credit: Vendor Account
      entries.push({
        ledger_account_id: vendorAccount.id,
        debit_amount: 0,
        credit_amount: totalAmount,
        narration: `Purchase from ${purchase.Vendor?.name || 'Vendor'} - ${purchase.invoice_number}`
      });

      // Create journal voucher
      const voucherData = {
        date: purchase.invoice_date,
        voucher_type: 'Journal',
        voucher_number: `PUR-${purchase.id}`,
        narration: narration || `Purchase transaction - ${purchase.invoice_number}`,
        reference_number: purchase.invoice_number,
        entries: entries
      };

      const voucher = await this.ledgerRepo.createVoucherWithEntries(voucherData, entries);
      
      logger.info(`Created purchase journal entries for purchase ${purchase.id}`);
      return voucher;

    } catch (error) {
      logger.error(`Error creating purchase journal entries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create journal entries for sales transactions
   * @param {Object} sales - Sales object or array of sales
   * @param {Object} options - Integration options
   * @returns {Object} Created journal voucher
   */
  async createSalesJournalEntries(sales, options = {}) {
    try {
      const {
        autoCreateEntries = true,
        revenueAccountId = null,
        customerAccountId = null,
        cashAccountId = null,
        bankAccountId = null,
        narration = null
      } = options;

      if (!autoCreateEntries) {
        logger.info('Auto-creation disabled for sales journal entries');
        return null;
      }

      // Handle both single sale and array of sales
      const salesArray = Array.isArray(sales) ? sales : [sales];
      
      // Group sales by payment method and customer
      const groupedSales = this.groupSalesByPaymentMethod(salesArray);

      const vouchers = [];

      for (const [key, salesGroup] of Object.entries(groupedSales)) {
        const [paymentMethod, customerName] = key.split('|');
        
        // Get or create customer account
        const customerAccount = customerName === 'Cash' 
          ? await this.getOrCreateAccount('Cash Sales', 'Customer')
          : await this.getOrCreateCustomerAccount(customerName);

        // Get or create revenue account
        const revenueAccount = revenueAccountId
          ? await this.ledgerRepo.getAccountById(revenueAccountId)
          : await this.getOrCreateAccount('Sales Revenue', 'Customer');

        // Get payment account
        const paymentAccount = paymentMethod === 'Cash'
          ? await this.getOrCreateAccount('Cash on Hand', 'Asset')
          : await this.getOrCreateAccount('Bank Account', 'Bank');

        // Calculate totals
        const totalAmount = salesGroup.reduce((sum, sale) => sum + parseFloat(sale['Invoice Value'] || 0), 0);
        const taxableAmount = salesGroup.reduce((sum, sale) => sum + parseFloat(sale['Taxable Value'] || 0), 0);
        const cgstAmount = salesGroup.reduce((sum, sale) => sum + parseFloat(sale.CGST || 0), 0);
        const sgstAmount = salesGroup.reduce((sum, sale) => sum + parseFloat(sale.SGST || 0), 0);
        const igstAmount = salesGroup.reduce((sum, sale) => sum + parseFloat(sale.IGST || 0), 0);

        // Create journal entries
        const entries = [];

        // Debit: Payment Account (Cash/Bank)
        entries.push({
          ledger_account_id: paymentAccount.id,
          debit_amount: totalAmount,
          credit_amount: 0,
          narration: `Sales receipt - ${paymentMethod} - ${salesGroup.length} transactions`
        });

        // Credit: Revenue Account
        entries.push({
          ledger_account_id: revenueAccount.id,
          debit_amount: 0,
          credit_amount: taxableAmount,
          narration: `Sales revenue - ${salesGroup.length} transactions`
        });

        // Credit: GST Accounts (if applicable)
        if (cgstAmount > 0) {
          const cgstAccount = await this.getOrCreateAccount('CGST Receivable', 'Asset');
          entries.push({
            ledger_account_id: cgstAccount.id,
            debit_amount: 0,
            credit_amount: cgstAmount,
            narration: `CGST on sales - ${salesGroup.length} transactions`
          });
        }

        if (sgstAmount > 0) {
          const sgstAccount = await this.getOrCreateAccount('SGST Receivable', 'Asset');
          entries.push({
            ledger_account_id: sgstAccount.id,
            debit_amount: 0,
            credit_amount: sgstAmount,
            narration: `SGST on sales - ${salesGroup.length} transactions`
          });
        }

        if (igstAmount > 0) {
          const igstAccount = await this.getOrCreateAccount('IGST Receivable', 'Asset');
          entries.push({
            ledger_account_id: igstAccount.id,
            debit_amount: 0,
            credit_amount: igstAmount,
            narration: `IGST on sales - ${salesGroup.length} transactions`
          });
        }

        // Create journal voucher
        const voucherData = {
          date: salesGroup[0].Date,
          voucher_type: 'Journal',
          voucher_number: `SAL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          narration: narration || `Sales transaction - ${paymentMethod} - ${salesGroup.length} items`,
          reference_number: `SALES-${salesGroup[0].Date}`,
          entries: entries
        };

        const voucher = await this.ledgerRepo.createVoucherWithEntries(voucherData, entries);
        vouchers.push(voucher);
      }

      logger.info(`Created sales journal entries for ${salesArray.length} sales`);
      return vouchers;

    } catch (error) {
      logger.error(`Error creating sales journal entries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create journal entries for customer payments
   * @param {Object} payment - Payment object
   * @param {Object} options - Integration options
   * @returns {Object} Created journal voucher
   */
  async createCustomerPaymentJournalEntries(payment, options = {}) {
    try {
      const {
        autoCreateEntries = true,
        customerAccountId = null,
        cashAccountId = null,
        bankAccountId = null,
        narration = null
      } = options;

      if (!autoCreateEntries) {
        logger.info('Auto-creation disabled for customer payment journal entries');
        return null;
      }

      // Get or create customer account
      const customerAccount = customerAccountId
        ? await this.ledgerRepo.getAccountById(customerAccountId)
        : await this.getOrCreateCustomerAccount(payment.customerName);

      // Get payment account based on payment method
      const paymentAccount = payment.paymentMethod === 'Cash'
        ? await this.getOrCreateAccount('Cash on Hand', 'Asset')
        : await this.getOrCreateAccount('Bank Account', 'Bank');

      // Create journal entries
      const entries = [
        {
          ledger_account_id: paymentAccount.id,
          debit_amount: payment.amount,
          credit_amount: 0,
          narration: `Payment received from ${payment.customerName}`
        },
        {
          ledger_account_id: customerAccount.id,
          debit_amount: 0,
          credit_amount: payment.amount,
          narration: `Payment received from ${payment.customerName}`
        }
      ];

      // Create journal voucher
      const voucherData = {
        date: payment.paymentDate,
        voucher_type: 'Receipt',
        voucher_number: `CP-${payment.id || Date.now()}`,
        narration: narration || `Customer payment - ${payment.customerName}`,
        reference_number: payment.referenceNumber,
        entries: entries
      };

      const voucher = await this.ledgerRepo.createVoucherWithEntries(voucherData, entries);
      
      logger.info(`Created customer payment journal entries for payment ${payment.id}`);
      return voucher;

    } catch (error) {
      logger.error(`Error creating customer payment journal entries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create vendor account
   */
  async getOrCreateVendorAccount(vendorId, vendorData) {
    try {
      // Try to find existing vendor account
      const existingAccount = await this.ledgerRepo.LedgerAccount.findOne({
        where: { 
          name: vendorData?.name || `Vendor ${vendorId}`,
          account_type: 'Vendor'
        }
      });

      if (existingAccount) {
        return existingAccount;
      }

      // Create new vendor account
      const accountData = {
        name: vendorData?.name || `Vendor ${vendorId}`,
        account_type: 'Vendor',
        is_system_account: false,
        status: 'active'
      };

      return await this.ledgerRepo.createAccount(accountData);

    } catch (error) {
      logger.error(`Error getting/creating vendor account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create customer account
   */
  async getOrCreateCustomerAccount(customerName) {
    try {
      // Try to find existing customer account
      const existingAccount = await this.ledgerRepo.LedgerAccount.findOne({
        where: { 
          name: customerName,
          account_type: 'Customer'
        }
      });

      if (existingAccount) {
        return existingAccount;
      }

      // Create new customer account
      const accountData = {
        name: customerName,
        account_type: 'Customer',
        is_system_account: false,
        status: 'active'
      };

      return await this.ledgerRepo.createAccount(accountData);

    } catch (error) {
      logger.error(`Error getting/creating customer account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create account by name and type
   */
  async getOrCreateAccount(accountName, accountType) {
    try {
      // Try to find existing account
      const existingAccount = await this.ledgerRepo.LedgerAccount.findOne({
        where: { 
          name: accountName,
          account_type: accountType
        }
      });

      if (existingAccount) {
        return existingAccount;
      }

      // Create new account
      const accountData = {
        name: accountName,
        account_type: accountType,
        is_system_account: false,
        status: 'active'
      };

      return await this.ledgerRepo.createAccount(accountData);

    } catch (error) {
      logger.error(`Error getting/creating account ${accountName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Group sales by payment method and customer
   */
  groupSalesByPaymentMethod(salesArray) {
    const grouped = {};

    salesArray.forEach(sale => {
      const paymentMethod = sale['Bill Mode'] || 'Cash';
      const customerName = sale['Party Name'] || 'Cash';
      const key = `${paymentMethod}|${customerName}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(sale);
    });

    return grouped;
  }

  /**
   * Get integration settings for a tenant
   */
  async getIntegrationSettings(tenantId) {
    // This would typically come from a settings table
    // For now, return default settings
    return {
      purchaseAutoEntries: true,
      salesAutoEntries: true,
      customerPaymentAutoEntries: true,
      defaultExpenseAccountId: null,
      defaultRevenueAccountId: null,
      defaultCashAccountId: null,
      defaultBankAccountId: null
    };
  }

  /**
   * Update integration settings for a tenant
   */
  async updateIntegrationSettings(tenantId, settings) {
    // This would typically update a settings table
    // For now, just log the settings
    logger.info(`Updated integration settings for tenant ${tenantId}:`, settings);
    return settings;
  }
}
