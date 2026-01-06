// backend/controller/ledgerIntegration.controller.js

import { sendResponse } from '../util/response.util.js';
import { LedgerIntegrationService } from '../services/ledgerIntegration.service.js';
import { getTenantDbModels } from './helper/tenantDb.helper.js';
import { logger } from '../util/logger.util.js';

export default class LedgerIntegrationController {
  
  // Helper to get the integration service instance for the current tenant
  static async _getService(req) {
    const tenantSequelize = req.tenantSequelize || (await getTenantDbModels(req.user?.tenantDbName || req.tenant?.db_name)).tenantSequelize;
    return new LedgerIntegrationService(tenantSequelize);
  }

  /**
   * Create journal entries for a purchase
   * POST /api/tenant/ledger/integration/purchase/:purchaseId
   */
  static async createPurchaseJournalEntries(req, res) {
    try {
      const service = await LedgerIntegrationController._getService(req);
      const { purchaseId } = req.params;
      const options = req.body.options || {};

      // Get purchase data (this would typically come from the purchase repository)
      // For now, we'll assume the purchase data is passed in the request body
      const purchase = req.body.purchase;
      
      if (!purchase) {
        return sendResponse(res, { 
          success: false, 
          error: 'Purchase data is required', 
          status: 400 
        });
      }

      const voucher = await service.createPurchaseJournalEntries(purchase, options);
      
      return sendResponse(res, { 
        data: voucher, 
        message: 'Purchase journal entries created successfully' 
      });

    } catch (err) {
      logger.error(`Error creating purchase journal entries: ${err.message}`);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create purchase journal entries', 
        status: 500 
      });
    }
  }

  /**
   * Create journal entries for sales
   * POST /api/tenant/ledger/integration/sales
   */
  static async createSalesJournalEntries(req, res) {
    try {
      const service = await LedgerIntegrationController._getService(req);
      const { sales, options = {} } = req.body;

      if (!sales) {
        return sendResponse(res, { 
          success: false, 
          error: 'Sales data is required', 
          status: 400 
        });
      }

      const vouchers = await service.createSalesJournalEntries(sales, options);
      
      return sendResponse(res, { 
        data: vouchers, 
        message: 'Sales journal entries created successfully' 
      });

    } catch (err) {
      logger.error(`Error creating sales journal entries: ${err.message}`);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create sales journal entries', 
        status: 500 
      });
    }
  }

  /**
   * Create journal entries for customer payment
   * POST /api/tenant/ledger/integration/customer-payment
   */
  static async createCustomerPaymentJournalEntries(req, res) {
    try {
      const service = await LedgerIntegrationController._getService(req);
      const { payment, options = {} } = req.body;

      if (!payment) {
        return sendResponse(res, { 
          success: false, 
          error: 'Payment data is required', 
          status: 400 
        });
      }

      const voucher = await service.createCustomerPaymentJournalEntries(payment, options);
      
      return sendResponse(res, { 
        data: voucher, 
        message: 'Customer payment journal entries created successfully' 
      });

    } catch (err) {
      logger.error(`Error creating customer payment journal entries: ${err.message}`);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create customer payment journal entries', 
        status: 500 
      });
    }
  }

  /**
   * Get integration settings
   * GET /api/tenant/ledger/integration/settings
   */
  static async getIntegrationSettings(req, res) {
    try {
      const service = await LedgerIntegrationController._getService(req);
      const tenantId = req.user?.tenantId || req.tenant?.id;
      
      const settings = await service.getIntegrationSettings(tenantId);
      
      return sendResponse(res, { 
        data: settings, 
        message: 'Integration settings retrieved successfully' 
      });

    } catch (err) {
      logger.error(`Error getting integration settings: ${err.message}`);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to get integration settings', 
        status: 500 
      });
    }
  }

  /**
   * Update integration settings
   * PUT /api/tenant/ledger/integration/settings
   */
  static async updateIntegrationSettings(req, res) {
    try {
      const service = await LedgerIntegrationController._getService(req);
      const tenantId = req.user?.tenantId || req.tenant?.id;
      const settings = req.body;
      
      const updatedSettings = await service.updateIntegrationSettings(tenantId, settings);
      
      return sendResponse(res, { 
        data: updatedSettings, 
        message: 'Integration settings updated successfully' 
      });

    } catch (err) {
      logger.error(`Error updating integration settings: ${err.message}`);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to update integration settings', 
        status: 500 
      });
    }
  }

  /**
   * Get available accounts for integration
   * GET /api/tenant/ledger/integration/accounts
   */
  static async getAvailableAccounts(req, res) {
    try {
      const service = await LedgerIntegrationController._getService(req);
      const { accountType } = req.query;
      
      const accounts = await service.ledgerRepo.listAccounts({ 
        account_type: accountType,
        status: 'active'
      });
      
      return sendResponse(res, { 
        data: accounts, 
        message: 'Available accounts retrieved successfully' 
      });

    } catch (err) {
      logger.error(`Error getting available accounts: ${err.message}`);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to get available accounts', 
        status: 500 
      });
    }
  }

  /**
   * Test integration with sample data
   * POST /api/tenant/ledger/integration/test
   */
  static async testIntegration(req, res) {
    try {
      const service = await LedgerIntegrationController._getService(req);
      const { testType, testData } = req.body;

      let result;
      switch (testType) {
        case 'purchase':
          result = await service.createPurchaseJournalEntries(testData, { autoCreateEntries: true });
          break;
        case 'sales':
          result = await service.createSalesJournalEntries(testData, { autoCreateEntries: true });
          break;
        case 'customer_payment':
          result = await service.createCustomerPaymentJournalEntries(testData, { autoCreateEntries: true });
          break;
        default:
          return sendResponse(res, { 
            success: false, 
            error: 'Invalid test type. Must be purchase, sales, or customer_payment', 
            status: 400 
          });
      }

      return sendResponse(res, { 
        data: result, 
        message: 'Integration test completed successfully' 
      });

    } catch (err) {
      logger.error(`Error testing integration: ${err.message}`);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Integration test failed', 
        status: 500 
      });
    }
  }
}
