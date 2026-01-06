import { sendResponse } from '../util/response.util.js'
import { SalesRepository } from '../repository/sales.repository.js'
import { getTenantDbModels } from './helper/tenantDb.helper.js'
import { LedgerIntegrationService } from '../services/ledgerIntegration.service.js'
import { logger } from '../util/logger.util.js'

export default class SalesController {
  static async _getRepo(req) {
    const tenantSequelize = req.tenantSequelize || (await getTenantDbModels(req.user?.tenantDbName || req.tenant?.db_name)).tenantSequelize
    return new SalesRepository(tenantSequelize)
  }

  // Helper to get the ledger integration service
  static async _getLedgerService(req) {
    const tenantSequelize = req.tenantSequelize || (await getTenantDbModels(req.user?.tenantDbName || req.tenant?.db_name)).tenantSequelize
    return new LedgerIntegrationService(tenantSequelize)
  }

  static async list(req, res) {
    try {
      const repo = await SalesController._getRepo(req)
      const data = await repo.listSales(req.query, { limit: Number(req.query.limit) || 500 })
      return sendResponse(res, { data })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to list sales', status: 500 })
    }
  }

  static async createManual(req, res) {
    try {
      const repo = await SalesController._getRepo(req)
      const row = req.body || {}
      row.created_by_id = req.user?.id
      const created = await repo.createManualSale(row)
      
      // Create journal entries if auto-creation is enabled
      try {
        const ledgerService = await SalesController._getLedgerService(req)
        const integrationSettings = await ledgerService.getIntegrationSettings(req.user?.tenantId)
        
        if (integrationSettings.salesAutoEntries) {
          await ledgerService.createSalesJournalEntries([created], {
            autoCreateEntries: true,
            ...integrationSettings
          })
          logger.info(`Created journal entries for sale ${created.id}`)
        }
      } catch (ledgerError) {
        // Log the error but don't fail the sale creation
        logger.error(`Failed to create journal entries for sale ${created.id}: ${ledgerError.message}`)
      }
      
      return sendResponse(res, { data: created, message: 'Sale created' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create sale', status: 500 })
    }
  }

  static async previewPos(req, res) {
    try {
      const repo = await SalesController._getRepo(req)
      const preview = await repo.previewPosGroups(req.query)
      return sendResponse(res, { data: preview })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to preview POS groups', status: 500 })
    }
  }

  static async exportPos(req, res) {
    try {
      const repo = await SalesController._getRepo(req)
      const result = await repo.exportPosGroups({
        ...req.body,
        created_by_id: req.user?.id
      })
      return sendResponse(res, { data: result, message: 'Exported to Sales' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to export POS groups', status: 500 })
    }
  }

  static async getPaymentMethods(req, res) {
    try {
      const repo = await SalesController._getRepo(req)
      const paymentMethods = await repo.getPaymentMethods()
      return sendResponse(res, { data: paymentMethods })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch payment methods', status: 500 })
    }
  }

  // --- Ledger Integration Methods ---

  /**
   * Create journal entries for sales data
   * POST /api/tenant/sales/create-journal-entries
   */
  static async createJournalEntries(req, res) {
    try {
      const ledgerService = await SalesController._getLedgerService(req)
      const { sales, options = {} } = req.body

      if (!sales) {
        return sendResponse(res, { 
          success: false, 
          error: 'Sales data is required', 
          status: 400 
        })
      }

      const vouchers = await ledgerService.createSalesJournalEntries(sales, options)
      
      return sendResponse(res, { 
        data: vouchers, 
        message: 'Journal entries created successfully for sales' 
      })

    } catch (err) {
      logger.error(`Error creating journal entries for sales: ${err.message}`)
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create journal entries', 
        status: 500 
      })
    }
  }

  /**
   * Create journal entries for customer payment
   * POST /api/tenant/sales/customer-payment
   */
  static async createCustomerPaymentJournalEntries(req, res) {
    try {
      const ledgerService = await SalesController._getLedgerService(req)
      const { payment, options = {} } = req.body

      if (!payment) {
        return sendResponse(res, { 
          success: false, 
          error: 'Payment data is required', 
          status: 400 
        })
      }

      const voucher = await ledgerService.createCustomerPaymentJournalEntries(payment, options)
      
      return sendResponse(res, { 
        data: voucher, 
        message: 'Customer payment journal entries created successfully' 
      })

    } catch (err) {
      logger.error(`Error creating customer payment journal entries: ${err.message}`)
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create customer payment journal entries', 
        status: 500 
      })
    }
  }

  /**
   * Get integration settings for sales
   * GET /api/tenant/sales/integration-settings
   */
  static async getIntegrationSettings(req, res) {
    try {
      const ledgerService = await SalesController._getLedgerService(req)
      const settings = await ledgerService.getIntegrationSettings(req.user?.tenantId)
      
      return sendResponse(res, { 
        data: settings, 
        message: 'Integration settings retrieved successfully' 
      })

    } catch (err) {
      logger.error(`Error getting integration settings: ${err.message}`)
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to get integration settings', 
        status: 500 
      })
    }
  }
}


