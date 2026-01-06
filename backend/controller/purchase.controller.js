import { sendResponse } from '../util/response.util.js';
import { PurchaseRepository } from '../repository/purchase.repository.js';
import { getTenantDbModels } from './helper/tenantDb.helper.js';
import { logger } from '../util/logger.util.js';
import { LedgerIntegrationService } from '../services/ledgerIntegration.service.js';

export default class PurchaseController {
  
  // Helper to get the repository instance for the current tenant
  static async _getRepo(req) {
      const tenantSequelize = req.tenantSequelize || (await getTenantDbModels(req.user?.tenantDbName || req.tenant?.db_name)).tenantSequelize;
      const repo = new PurchaseRepository(tenantSequelize);
      // Ensure tables exist for this tenant before operations
      if (typeof repo.init === 'function') {
        await repo.init();
      }
      return repo;
  }

  // Helper to get the ledger integration service
  static async _getLedgerService(req) {
      const tenantSequelize = req.tenantSequelize || (await getTenantDbModels(req.user?.tenantDbName || req.tenant?.db_name)).tenantSequelize;
      return new LedgerIntegrationService(tenantSequelize);
  }

  // --- Vendor Methods (Largely unchanged, just using the helper) ---

  static async createVendor(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      if (!req.body.name) {
        return sendResponse(res, { success: false, error: 'Vendor name is required', status: 400 });
      }
      const vendor = await repo.createVendor(req.body);
      return sendResponse(res, { data: vendor, message: 'Vendor created', status: 201 });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
          return sendResponse(res, { success: false, error: 'A vendor with this name already exists.', status: 409 });
      }
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create vendor', status: 500 });
    }
  }

  static async listVendors(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const vendors = await repo.listVendors(req.query);
      return sendResponse(res, { data: vendors });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch vendors', status: 500 });
    }
  }

  static async getVendor(req, res) {
    try {
        const repo = await PurchaseController._getRepo(req);
        const vendor = await repo.getVendorById(req.params.id);
        if (!vendor) return sendResponse(res, { success: false, error: 'Vendor not found', status: 404 });
        return sendResponse(res, { data: vendor });
    } catch (err) {
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch vendor', status: 500 });
    }
  }

  static async updateVendor(req, res) {
      try {
          const repo = await PurchaseController._getRepo(req);
          const updated = await repo.updateVendor(req.params.id, req.body);
          if (!updated) return sendResponse(res, { success: false, error: 'Vendor not found', status: 404 });
          return sendResponse(res, { data: updated, message: 'Vendor updated' });
      } catch (err) {
          return sendResponse(res, { success: false, error: err.message, message: 'Failed to update vendor', status: 500 });
      }
  }

  static async deleteVendor(req, res) {
    try {
        const repo = await PurchaseController._getRepo(req);
        const deletedCount = await repo.deleteVendor(req.params.id);
        if (deletedCount === 0) {
            return sendResponse(res, { success: false, error: 'Vendor not found', status: 404 });
        }
        return sendResponse(res, { message: 'Vendor deactivated successfully' });
    } catch (err) {
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete vendor', status: 500 });
    }
  }

  static async getProductsForPurchase(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const products = await repo.getProductsForPurchase();
      return sendResponse(res, { data: products });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch products', status: 500 });
    }
  }

  static async calculateItemTotal(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const itemData = req.body;

      if (!itemData.product_id || itemData.quantity === undefined || itemData.purchase_rate === undefined) {
          return sendResponse(res, { success: false, error: 'product_id, quantity, and purchase_rate are required.', status: 400 });
      }

      const totals = await repo.calculateLineItemTotals(itemData);
      return sendResponse(res, { data: totals });
    } catch (err) {
        if (err.message.includes('not found')) {
            return sendResponse(res, { success: false, error: err.message, status: 404 });
        }
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to calculate totals', status: 500 });
    }
  }

  static async createPurchase(req, res) {
    try {
      logger.info(`[purchase.controller]-[createPurchase]: Received request body: ${JSON.stringify(req.body)}`);
      const repo = await PurchaseController._getRepo(req);
      const { items, ...purchaseData } = req.body;
      
      // The controller's job is simple validation. The repository will do the heavy lifting.
      if (!purchaseData.vendor_id || !purchaseData.invoice_number || !purchaseData.invoice_date) {
        logger.warn(`[purchase.controller]-[createPurchase]: Validation failed - missing required fields. vendor_id: ${purchaseData.vendor_id}, invoice_number: ${purchaseData.invoice_number}, invoice_date: ${purchaseData.invoice_date}`);
        return sendResponse(res, { success: false, error: 'vendor_id, invoice_number, and invoice_date are required.', status: 400 });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        logger.warn(`[purchase.controller]-[createPurchase]: Validation failed - no items. items: ${JSON.stringify(items)}`);
        return sendResponse(res, { success: false, error: 'At least one purchase item is required.', status: 400 });
      }
      
      logger.info(`[purchase.controller]-[createPurchase]: Creating purchase for user ${req.user?.id}, vendor ${purchaseData.vendor_id}, items count ${items.length}`);
      
      // Add the user ID who is creating this purchase
      purchaseData.created_by_id = req.user?.id;

      // Delegate the entire creation and calculation logic to the repository
      const purchase = await repo.createPurchaseWithItems(purchaseData, items);
      
      // Create journal entries if auto-creation is enabled
      try {
        const ledgerService = await PurchaseController._getLedgerService(req);
        const integrationSettings = await ledgerService.getIntegrationSettings(req.user?.tenantId);
        
        if (integrationSettings.purchaseAutoEntries) {
          await ledgerService.createPurchaseJournalEntries(purchase, {
            autoCreateEntries: true,
            ...integrationSettings
          });
          logger.info(`Created journal entries for purchase ${purchase.id}`);
        }
      } catch (ledgerError) {
        // Log the error but don't fail the purchase creation
        logger.error(`Failed to create journal entries for purchase ${purchase.id}: ${ledgerError.message}`);
      }
      
      return sendResponse(res, { data: purchase, message: 'Purchase draft created successfully', status: 201 });
    } catch (err) {
      logger.error(`[purchase.controller]-[createPurchase]: Error creating purchase: ${err.message}`);
      // The repository might throw specific errors we can catch
      if (err.message.includes('not found')) {
          return sendResponse(res, { success: false, error: err.message, status: 404 });
      }
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create purchase', status: 500 });
    }
  }

  static async listPurchases(req, res) {
    try {
      console.log('Controller listPurchases called with req.query:', req.query);
      const repo = await PurchaseController._getRepo(req);
      // This endpoint is used to generate the "Purchase Register"
      const purchases = await repo.listPurchases(req.query);
      console.log('Controller returning purchases count:', purchases?.length || 0);
      return sendResponse(res, { data: purchases });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch purchases', status: 500 });
    }
  }

  static async getPurchase(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const purchase = await repo.getPurchaseById(req.params.id);
      if (!purchase) return sendResponse(res, { success: false, error: 'Purchase not found', status: 404 });
      return sendResponse(res, { data: purchase });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch purchase', status: 500 });
    }
  }

  static async updatePurchase(req, res) {
    try {
        const repo = await PurchaseController._getRepo(req);
        const { items, ...purchaseData } = req.body;

        const purchase = await repo.updatePurchaseWithItems(req.params.id, purchaseData, items);
        
        return sendResponse(res, { data: purchase, message: 'Purchase updated successfully' });
    } catch (err) {
        if (err.message.includes('not found')) {
            return sendResponse(res, { success: false, error: err.message, status: 404 });
        }
        if (err.message.includes('Cannot update a received purchase')) {
            return sendResponse(res, { success: false, error: err.message, status: 403 }); // Forbidden
        }
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to update purchase', status: 500 });
    }
  }

  static async updateStockPurchase(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const id = req.params.id;
      const existing = await repo.getPurchaseById(id);
      if (!existing) return sendResponse(res, { success: false, error: 'Purchase not found', status: 404 });
      if (!existing.items || existing.items.length === 0) return sendResponse(res, { success: false, error: 'Cannot update stock for a purchase without items', status: 400 });
      if (existing.status === 'Cancelled') return sendResponse(res, { success: false, error: 'Cannot update stock for a cancelled purchase', status: 409 });
      if (existing.status === 'Stock Updated') return sendResponse(res, { data: existing, message: 'Purchase stock already updated' });
      if (existing.status !== 'Draft') return sendResponse(res, { success: false, error: 'Only draft purchases can have stock updated', status: 409 });

      // Directly update stock and set status to 'Stock Updated'
      const t = await repo.sequelize.transaction();
      try {
        const purchase = await repo.Purchase.findByPk(id, {
          include: [{ model: repo.PurchaseItem, as: 'items', include: [{ model: repo.Product, include: [{ model: repo.ProductCategory, attributes: ['name', 'category_type'] }] }] }],
          transaction: t
        });

        if (!purchase) throw new Error('Purchase not found.');

        // Update stock for each item
        for (const item of purchase.items) {
          const categoryType = item.Product.ProductCategory.category_type;

          if (categoryType === 'Fuel') {
            // TODO: Implement fuel stock update logic for Tanks
            console.log(`LOG: Updating fuel stock for ${item.Product.name} by ${item.quantity}. (Tank logic needed)`);
          } else {
            // For non-fuel items, update the InventoryLevel table
            await repo.InventoryLevel.increment('quantity_on_hand', {
              by: item.quantity,
              where: { product_id: item.product_id },
              transaction: t
            });
          }
        }

        // Update the purchase status to 'Stock Updated'
        purchase.status = 'Stock Updated';
        await purchase.save({ transaction: t });

        await t.commit();
        const updated = await repo.getPurchaseById(id);
        return sendResponse(res, { data: updated, message: 'Purchase stock updated successfully' });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update stock', status: 500 });
    }
  }

  static async receivePurchaseInventory(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const { id } = req.params;
      
      // The repository will handle the transaction and all inventory logic.
      const purchase = await repo.receivePurchaseAndupdateStock(id);

      return sendResponse(res, { data: purchase, message: 'Purchase marked as received and stock updated successfully.' });
    } catch (err) {
        if (err.message.includes('not found')) {
            return sendResponse(res, { success: false, error: err.message, status: 404 });
        }
        if (err.message.includes('already been received')) {
            return sendResponse(res, { success: false, error: err.message, status: 409 }); // Conflict
        }
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to receive purchase', status: 500 });
    }
  }

  // Diagnostics: check enum labels for Purchase.status in the current tenant
  static async getStatusEnumInfo(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const info = await repo.getStatusEnumInfo();
      return sendResponse(res, { data: info || {}, message: 'Status enum info' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch status enum info', status: 500 });
    }
  }

  // --- Soft Delete Methods ---

  static async softDeletePurchase(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const result = await repo.softDeletePurchase(req.params.id);

      // repo.softDeletePurchase now returns { purchase, warnings } on success
      if (result && result.purchase) {
        return sendResponse(res, {
          data: result.purchase,
          message: 'Purchase deleted successfully',
          warnings: result.warnings || []
        });
      }

      // Backwards compatibility: if repository returned a purchase directly
      return sendResponse(res, { data: result, message: 'Purchase deleted successfully' });
    } catch (err) {
      // Log detailed error information for debugging transaction aborts
      try {
        logger.error(`[purchase.controller]-[softDeletePurchase]: ${err.message}`);
        if (err.original) logger.error('Original error:', err.original);
        if (err.parent) logger.error('Parent error:', err.parent);
      } catch (logErr) {
        console.error('Failed to log softDeletePurchase error details:', logErr && logErr.message ? logErr.message : logErr);
      }

      if (err.message && err.message.includes('not found')) {
        return sendResponse(res, { success: false, error: err.message, status: 404 });
      }

      // Surface a clearer DB-related message for transaction abort cases
      if (err.message && (err.message.toLowerCase().includes('current transaction is aborted') || err.message.toLowerCase().includes('transaction')) ) {
        return sendResponse(res, { success: false, error: 'Database transaction failed while deleting purchase. See server logs for details.', status: 500 });
      }

      return sendResponse(res, { success: false, error: err.message || 'Failed to delete purchase', message: 'Failed to delete purchase', status: 500 });
    }
  }

  static async restorePurchase(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const purchase = await repo.restorePurchase(req.params.id);

      return sendResponse(res, {
        data: purchase,
        message: 'Purchase restored successfully'
      });
    } catch (err) {
      if (err.message.includes('not found')) {
        return sendResponse(res, { success: false, error: err.message, status: 404 });
      }
      if (err.message.includes('not deleted')) {
        return sendResponse(res, { success: false, error: err.message, status: 400 });
      }
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to restore purchase', status: 500 });
    }
  }

  // Diagnostic endpoint: fetch purchase items and matching inventory levels to debug delete failures
  static async purchaseDeleteDiagnostics(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const id = req.params.id;
      const purchase = await repo.getPurchaseById(id);
      if (!purchase) return sendResponse(res, { success: false, error: 'Purchase not found', status: 404 });

      const inventoryData = [];
      for (const item of purchase.items || []) {
        const inv = await repo.InventoryLevel.findOne({ where: { product_id: item.product_id } });
        inventoryData.push({
          product_id: item.product_id,
          product_name: item.product_name_at_purchase,
          purchase_quantity: item.quantity,
          inventory: inv ? { id: inv.id, quantity_on_hand: inv.quantity_on_hand } : null
        });
      }

      return sendResponse(res, { data: { purchase: { id: purchase.id, status: purchase.status }, inventoryData } });
    } catch (err) {
      console.error('purchaseDeleteDiagnostics error:', err && err.message ? err.message : err);
      return sendResponse(res, { success: false, error: err.message || 'Diagnostics failed', status: 500 });
    }
  }

  // --- Ledger Integration Methods ---

  /**
   * Create journal entries for a specific purchase
   * POST /api/tenant/purchase/:id/create-journal-entries
   */
  static async createJournalEntries(req, res) {
    try {
      const repo = await PurchaseController._getRepo(req);
      const ledgerService = await PurchaseController._getLedgerService(req);
      const { id } = req.params;
      const options = req.body.options || {};

      // Get the purchase with vendor information
      const purchase = await repo.getPurchaseById(id);
      if (!purchase) {
        return sendResponse(res, { success: false, error: 'Purchase not found', status: 404 });
      }

      // Create journal entries
      const voucher = await ledgerService.createPurchaseJournalEntries(purchase, options);
      
      return sendResponse(res, { 
        data: voucher, 
        message: 'Journal entries created successfully for purchase' 
      });

    } catch (err) {
      logger.error(`Error creating journal entries for purchase: ${err.message}`);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create journal entries', 
        status: 500 
      });
    }
  }

  /**
   * Get integration settings for purchases
   * GET /api/tenant/purchase/integration-settings
   */
  static async getIntegrationSettings(req, res) {
    try {
      const ledgerService = await PurchaseController._getLedgerService(req);
      const settings = await ledgerService.getIntegrationSettings(req.user?.tenantId);
      
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
}