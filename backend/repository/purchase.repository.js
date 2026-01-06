import { Op } from 'sequelize';
import { initPurchaseModels } from '../models/purchase.model.js'
import { initProductModels } from '../models/product.model.js'

export class PurchaseRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    // Ensure models are initialized for this tenant connection
    const { Vendor, Purchase, PurchaseItem } = initPurchaseModels(sequelize);
    const { Product, ProductCategory, InventoryLevel } = initProductModels(sequelize);

    // Bind models used by repository
    this.Vendor = Vendor;
    this.Purchase = Purchase;
    this.PurchaseItem = PurchaseItem;
    this.Product = Product;
    this.ProductCategory = ProductCategory;
    this.InventoryLevel = InventoryLevel;
  }

  async init() {
    // Ensure required tables exist for this tenant.
    // Controlled strictly via environment variables to keep production safe.
    const alter = process.env.PURCHASE_SYNC_ALTER === 'true' || process.env.DB_SYNC_ALTER === 'true';
    const plain = process.env.PURCHASE_SYNC === 'true' || process.env.DB_SYNC === 'true';

    if (alter) {
      await this.Vendor.sync({ alter: true });
      await this.Purchase.sync({ alter: true });
      await this.PurchaseItem.sync({ alter: true });
      if (this.InventoryLevel?.sync) {
        await this.InventoryLevel.sync({ alter: true });
      }
    } else if (plain) {
      await this.Vendor.sync();
      await this.Purchase.sync();
      await this.PurchaseItem.sync();
      if (this.InventoryLevel?.sync) {
        await this.InventoryLevel.sync();
      }
    } else {
      // Neither alter nor plain sync requested; do nothing here.
    }
  }

  // --- Vendor Methods ---
  async createVendor(vendorData) {
    return this.Vendor.create(vendorData);
  }

  async listVendors(filter = {}) {
    const where = {};
    if (filter.status) where.status = filter.status;
    return this.Vendor.findAll({ where, order: [['name', 'ASC']] });
  }

  async getVendorById(id) {
    return this.Vendor.findByPk(id);
  }

  async updateVendor(id, vendorData) {
    const vendor = await this.Vendor.findByPk(id);
    if (!vendor) return null;
    await vendor.update(vendorData);
    return vendor;
  }

  async deleteVendor(id) {
    // Soft delete by setting status to inactive
    const [updatedCount] = await this.Vendor.update({ status: 'inactive' }, { where: { id } });
    return updatedCount;
  }


  // --- Purchase Methods ---

  /**
   * Creates a new Purchase and its items within a single transaction.
   * It takes raw data and calculates all totals on the backend to ensure integrity.
   */
  async createPurchaseWithItems(purchaseData, items) {
    const t = await this.sequelize.transaction();
    try {
      // 1. Validate vendor exists and get state for GST calculations
      const vendor = await this.Vendor.findByPk(purchaseData.vendor_id);
      if (!vendor) throw new Error(`Vendor with ID ${purchaseData.vendor_id} not found.`);
      if (!vendor.state) throw new Error('Vendor state is required for GST calculations.');

      // 1. Create the main Purchase record (as a Draft)
      const purchase = await this.Purchase.create({
          ...purchaseData,
          status: 'Draft', // Always start as a draft
      }, { transaction: t });

      // 2. Process and create all purchase items
      const processedItems = [];
      for (const item of items) {
          const product = await this.Product.findByPk(item.product_id);
          if (!product) throw new Error(`Product with ID ${item.product_id} not found.`);

          const calculatedItem = this._calculateLineItemTotals(item, product, vendor.state);
          processedItems.push({
              ...calculatedItem,
              purchase_id: purchase.id,
              product_id: product.id,
              product_name_at_purchase: product.name,
              hsn_code_at_purchase: product.hsn_code,
          });
      }
      await this.PurchaseItem.bulkCreate(processedItems, { transaction: t });

      // 3. Calculate and update the final totals on the main Purchase record
      await this._updatePurchaseTotals(purchase.id, t);

      await t.commit();
      return this.getPurchaseById(purchase.id); // Return the full record with all details
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async listPurchases(filter = {}) {
    console.log('First listPurchases called with filter:', filter);
    const where = {};
    // Add filtering for date ranges, vendor, status etc. to power the "Purchase Register"
    if (filter.vendor_id) where.vendor_id = filter.vendor_id;
    if (filter.status) where.status = filter.status;
    if (filter.startDate && filter.endDate) {
        where.invoice_date = {
            [Op.between]: [filter.startDate, filter.endDate]
        };
    }

    return this.Purchase.findAll({
      where,
      include: [
        { model: this.Vendor, attributes: ['id', 'name'] },
        // We include items for a summary view, maybe not all fields
        { model: this.PurchaseItem, as: 'items', attributes: ['product_name_at_purchase', 'quantity', 'purchase_rate', 'line_total'] }
      ],
      order: [['invoice_date', 'DESC']]
    });
  }

  async getPurchaseById(id) {
    return this.Purchase.findByPk(id, {
      include: [
        { model: this.Vendor },
        { model: this.PurchaseItem, as: 'items', include: [{ model: this.Product }] }
      ]
    });
  }

  async updatePurchaseWithItems(purchaseId, purchaseData = {}, items = undefined) {
    // Preflight: if we're about to set status to 'Stock Updated', ensure the DB enum supports it.
    if (purchaseData && purchaseData.status === 'Stock Updated') {
      await this._ensureStatusEnumHasStockUpdated();
    }
    const t = await this.sequelize.transaction();
    try {
      const purchase = await this.Purchase.findByPk(purchaseId, { include: [{ model: this.PurchaseItem, as: 'items' }], transaction: t, lock: t.LOCK.UPDATE });
      if (!purchase) throw new Error('Purchase not found');

      if (purchase.status === 'Stock Updated') throw new Error('Cannot update a stock updated purchase');
      if (purchase.status === 'Cancelled') throw new Error('Cannot update a cancelled purchase');

      if (Array.isArray(items)) {
        // Get vendor state for GST calculations
        const vendor = await this.Vendor.findByPk(purchase.vendor_id);
        if (!vendor) throw new Error(`Vendor with ID ${purchase.vendor_id} not found.`);
        if (!vendor.state) throw new Error('Vendor state is required for GST calculations.');

        await this.PurchaseItem.destroy({ where: { purchase_id: purchase.id }, transaction: t });
        const processed = [];
        for (const item of items) {
          const product = await this.Product.findByPk(item.product_id, { transaction: t });
          if (!product) throw new Error(`Product with ID ${item.product_id} not found.`);
          const calc = this._calculateLineItemTotals(item, product, vendor.state);
          processed.push({
            ...calc,
            purchase_id: purchase.id,
            product_id: product.id,
            product_name_at_purchase: product.name,
            hsn_code_at_purchase: product.hsn_code,
          });
        }
        if (processed.length === 0) throw new Error('At least one purchase item is required.');
        await this.PurchaseItem.bulkCreate(processed, { transaction: t });
      }

      await purchase.update(purchaseData, { transaction: t });
      await this._updatePurchaseTotals(purchase.id, t);
      await t.commit();
      return this.getPurchaseById(purchase.id);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // Ensure the underlying Postgres enum type for Purchase.status contains the 'Stock Updated' value.
  async _ensureStatusEnumHasStockUpdated() {
    try {
      if (!this.sequelize.getDialect || this.sequelize.getDialect() !== 'postgres') return;
      const tbl = this.Purchase.getTableName();
      const tableName = typeof tbl === 'string' ? tbl : tbl.tableName;
      const tableSchema = typeof tbl === 'string' ? null : (tbl.schema || null);
      // Find the actual enum type name and its schema for the status column, filtering by the TABLE's schema
      const [rows] = await this.sequelize.query(
        `SELECT 
            t.typname AS enum_name,
            tn.nspname AS enum_schema
         FROM pg_type t
         JOIN pg_enum e ON e.enumtypid = t.oid
         JOIN pg_attribute a ON a.atttypid = t.oid AND a.attname = 'status'
         JOIN pg_class c ON c.oid = a.attrelid AND c.relname = :tableName
         JOIN pg_namespace tn ON tn.oid = t.typnamespace           -- enum type schema
         JOIN pg_namespace cn ON cn.oid = c.relnamespace           -- table schema
         WHERE (:tableSchema IS NULL OR cn.nspname = :tableSchema)
         LIMIT 1;`,
        { replacements: { tableName, tableSchema } }
      );
      if (!rows || rows.length === 0) return; // Not an enum or column not found
      const enumName = rows[0].enum_name;
      const enumSchema = rows[0].enum_schema || tableSchema || 'public';

      const sql = `DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_namespace ns ON ns.oid = t.typnamespace
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = '${enumName}' AND ns.nspname = '${enumSchema}' AND e.enumlabel = 'Stock Updated'
          ) THEN
            ALTER TYPE "${enumSchema}"."${enumName}" ADD VALUE 'Stock Updated';
          END IF;
        END$$;`;
      await this.sequelize.query(sql);
    } catch (err) {
      // Log and continue; if this fails due to permissions, confirm will still fail with a clear DB error
      console.warn('Warning: could not ensure enum value \'Stock Updated\' for Purchase.status:', err.message);
    }
  }
  
  // Diagnostic to fetch current enum labels for Purchase.status
  async getStatusEnumInfo() {
    if (!this.sequelize.getDialect || this.sequelize.getDialect() !== 'postgres') {
      return { dialect: this.sequelize.getDialect?.() || 'unknown' };
    }
    const tbl = this.Purchase.getTableName();
    const tableName = typeof tbl === 'string' ? tbl : tbl.tableName;
    const tableSchema = typeof tbl === 'string' ? null : (tbl.schema || null);
    const [rows] = await this.sequelize.query(
      `SELECT 
          t.typname AS enum_name,
          tn.nspname AS enum_schema,
          array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
       JOIN pg_attribute a ON a.atttypid = t.oid AND a.attname = 'status'
       JOIN pg_class c ON c.oid = a.attrelid AND c.relname = :tableName
       JOIN pg_namespace tn ON tn.oid = t.typnamespace
       JOIN pg_namespace cn ON cn.oid = c.relnamespace
       WHERE (:tableSchema IS NULL OR cn.nspname = :tableSchema)
       GROUP BY t.typname, tn.nspname
       LIMIT 1;`,
      { replacements: { tableName, tableSchema } }
    );
    return rows?.[0] || null;
  }
  
  async _updatePurchaseTotals(purchaseId, transaction) {
    const purchase = await this.Purchase.findByPk(purchaseId, { include: [{ model: this.PurchaseItem, as: 'items' }], transaction });
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const totals = (purchase.items || []).reduce((acc, item) => {
      acc.subtotal += toNum(item.line_total);
      acc.discount_amount += toNum(item.discount_amount);
      acc.taxable_amount += toNum(item.taxable_amount);
      acc.cgst_amount += toNum(item.cgst_amount);
      acc.sgst_amount += toNum(item.sgst_amount);
      acc.igst_amount += toNum(item.igst_amount);
      acc.cess_amount += toNum(item.cess_amount);
      return acc;
    }, { subtotal: 0, discount_amount: 0, taxable_amount: 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0, cess_amount: 0 });
    totals.total_amount = toNum(totals.taxable_amount + totals.cgst_amount + totals.sgst_amount + totals.igst_amount + totals.cess_amount);
    Object.keys(totals).forEach((k) => { if (!Number.isFinite(totals[k])) totals[k] = 0; });
    await purchase.update(totals, { transaction });
  }
  
  /**
   * This is the critical method that receives the inventory.
   * It updates stock levels and changes the Purchase status to 'Received'.
   */
  async receivePurchaseAndupdateStock(purchaseId) {
    const t = await this.sequelize.transaction();
    try {
      const purchase = await this.Purchase.findByPk(purchaseId, {
        include: [{ model: this.PurchaseItem, as: 'items', include: [{ model: this.Product, include: [{ model: this.ProductCategory, attributes: ['name', 'category_type'] }] }] }],
        transaction: t
      });

      if (!purchase) throw new Error('Purchase not found.');
      if (purchase.status === 'Cancelled') throw new Error('This purchase is cancelled.');
      if (purchase.status === 'Received') throw new Error('This purchase has already been received.');
      if (purchase.status !== 'Confirmed') throw new Error('Only a confirmed purchase can be received.');

      // Update stock for each item
      for (const item of purchase.items) {
        const categoryType = item.Product.ProductCategory.category_type;

        if (categoryType === 'Fuel') {
          // TODO: Implement fuel stock update logic for Tanks
          console.log(`LOG: Updating fuel stock for ${item.Product.name} by ${item.quantity}. (Tank logic needed)`);
        } else {
          // For non-fuel items, update the InventoryLevel table
          await this.InventoryLevel.increment('quantity_on_hand', {
            by: item.quantity,
            where: { product_id: item.product_id },
            transaction: t
          });
        }
      }

      // Finally, update the purchase status to 'Received'
      purchase.status = 'Received';
      await purchase.save({ transaction: t });

      await t.commit();
      return purchase;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // --- UI Helper Methods ---

  /**
   * Fetches products to populate the purchase form. Includes current stock for display.
   */
  async getProductsForPurchase() {
    return this.Product.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'hsn_code', 'gst_rate'],
      include: [{
        model: this.InventoryLevel,
        attributes: ['quantity_on_hand'],
        required: false // LEFT JOIN to include products that might not have an inventory entry yet
      }],
      order: [['name', 'ASC']]
    });
  }

  /**
   * Public method for the controller to calculate totals for a single item in real-time.
   */
  async calculateLineItemTotals(itemData) {
      const product = await this.Product.findByPk(itemData.product_id);
      if (!product) throw new Error('Product not found');

      // Get vendor state for GST calculations if vendor_id is provided
      let vendorState = null;
      if (itemData.vendor_id) {
        const vendor = await this.Vendor.findByPk(itemData.vendor_id);
        if (vendor && vendor.state) {
          vendorState = vendor.state;
        }
      }

      return this._calculateLineItemTotals(itemData, product, vendorState);
  }
  
  // --- Internal Helper Methods ---

  _calculateLineItemTotals(item, product, vendorState = null) {
    const quantity = parseFloat(item.quantity || 0);
    const purchase_rate = parseFloat(item.purchase_rate || 0);
    const discount = parseFloat(item.discount || 0);
    const gst_rate = parseFloat(product.gst_rate || 0);
    const cess_rate = parseFloat(product.cess_rate || 0);

    const line_total = quantity * purchase_rate;
    const taxable_amount = line_total - discount;

    // Check if GST amounts are manually provided (from frontend editing)
    let gst_rate_to_use = gst_rate; // Default to product GST rate
    if (item.gst_rate !== undefined) {
      // Use manually entered GST rate
      gst_rate_to_use = parseFloat(item.gst_rate || 0);
    }

    let cgst_amount, sgst_amount, igst_amount, cess_amount;

    if (item.cgst_amount !== undefined && item.sgst_amount !== undefined && 
        item.igst_amount !== undefined) {
      // Use manually entered GST amounts
      cgst_amount = parseFloat(item.cgst_amount || 0);
      sgst_amount = parseFloat(item.sgst_amount || 0);
      igst_amount = parseFloat(item.igst_amount || 0);
    } else {
      // Auto-calculate GST amounts based on vendor state (Indian GST rules)
      const total_gst_amount = taxable_amount * (gst_rate_to_use / 100);

      // Karnataka is the home state - use CGST/SGST for Karnataka vendors, IGST for others
      if (vendorState && vendorState.toLowerCase() === 'karnataka') {
        // Intra-state: Split GST into CGST and SGST
        cgst_amount = total_gst_amount / 2;
        sgst_amount = total_gst_amount / 2;
        igst_amount = 0;
      } else {
        // Inter-state: Use IGST
        cgst_amount = 0;
        sgst_amount = 0;
        igst_amount = total_gst_amount;
      }
    }

    // Handle cess calculation - preserve manual entries or auto-calculate
    let cess_rate_to_use = cess_rate; // Default to product cess rate
    if (item.cess_rate !== undefined) {
      // Use manually entered cess rate
      cess_rate_to_use = parseFloat(item.cess_rate || 0);
    }

    if (item.cess_amount !== undefined) {
      // Use manually entered cess amount
      cess_amount = parseFloat(item.cess_amount || 0);
    } else {
      // Auto-calculate cess amount from cess rate
      cess_amount = taxable_amount * (cess_rate_to_use / 100);
    }

    return {
      quantity,
      purchase_rate,
      discount_amount: discount,
      line_total,
      taxable_amount,
      gst_rate: gst_rate_to_use,
      cgst_amount,
      sgst_amount,
      igst_amount,
      cess_amount,
    };
  }

  async _updatePurchaseTotals(purchaseId, transaction) {
    const purchase = await this.Purchase.findByPk(purchaseId, { include: [{ model: this.PurchaseItem, as: 'items' }], transaction });
    
    const totals = purchase.items.reduce((acc, item) => {
        acc.subtotal += parseFloat(item.line_total);
        acc.discount_amount += parseFloat(item.discount_amount);
        acc.taxable_amount += parseFloat(item.taxable_amount);
        acc.cgst_amount += parseFloat(item.cgst_amount);
        acc.sgst_amount += parseFloat(item.sgst_amount);
        acc.igst_amount += parseFloat(item.igst_amount);
        acc.cess_amount += parseFloat(item.cess_amount);
        return acc;
    }, { subtotal: 0, discount_amount: 0, taxable_amount: 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0, cess_amount: 0 });

    totals.total_amount = totals.taxable_amount + totals.cgst_amount + totals.sgst_amount + totals.igst_amount + totals.cess_amount;

    await purchase.update(totals, { transaction });
  }

  // --- Soft Delete Methods ---

  async softDeletePurchase(purchaseId) {
    // Preflight: check existence and prepare inventory for reversal to avoid mid-transaction failures
    const existingPurchase = await this.Purchase.findByPk(purchaseId, {
      include: [{ model: this.PurchaseItem, as: 'items' }]
    });

    if (!existingPurchase) throw new Error('Purchase not found');

    if (existingPurchase.status === 'Deleted') {
      // Nothing to do
      return { purchase: existingPurchase, warnings: [] };
    }

    const preflightWarnings = [];
    if (existingPurchase.status === 'Stock Updated') {
      // Ensure InventoryLevel rows exist for each product; create missing ones with 0 quantity
      for (const item of existingPurchase.items) {
        const inv = await this.InventoryLevel.findOne({ where: { product_id: item.product_id } });
        if (!inv) {
          // Create a zeroed inventory level so reversal can proceed; warn the caller
          try {
            await this.InventoryLevel.create({ product_id: item.product_id, quantity_on_hand: 0, opening_stock: 0, stock_value: 0, opening_stock_value: 0 });
            preflightWarnings.push(`Created missing InventoryLevel for product ${item.product_id} with quantity 0`);
          } catch (createErr) {
            // If creation fails, warn and continue; the transaction will handle consistency
            preflightWarnings.push(`Failed to create InventoryLevel for product ${item.product_id}: ${createErr.message}`);
          }
        }
      }
    }

    // Now proceed with transactional reversal and soft-delete
    const t = await this.sequelize.transaction();
    try {
      const purchase = await this.Purchase.findByPk(purchaseId, {
        include: [{ model: this.PurchaseItem, as: 'items' }],
        transaction: t
      });

      if (!purchase) {
        await t.rollback();
        throw new Error('Purchase not found');
      }

      // If purchase has stock updated, reverse the stock before deleting
      let reversalWarnings = [];
      if (purchase.status === 'Stock Updated') {
        reversalWarnings = await this._reverseStockQuantities(purchase, t);
      }

      // Soft delete the purchase
      await purchase.update({ status: 'Deleted', deleted_at: new Date() }, { transaction: t });

      await t.commit();
      // Fetch fresh purchase record
      const full = await this.getPurchaseById(purchase.id);
      const warnings = [...preflightWarnings, ...reversalWarnings];
      return { purchase: full, warnings };
    } catch (err) {
      // Ensure rollback does not throw and log the original error for diagnosis
      try {
        await t.rollback();
      } catch (rbErr) {
        console.error('Failed to rollback transaction in softDeletePurchase:', rbErr && rbErr.message ? rbErr.message : rbErr);
      }

      // Log detailed DB error info to help identify 'current transaction is aborted' cases
      try {
        console.error('Error in softDeletePurchase:', err && err.message ? err.message : err);
        if (err.original) console.error('Original error:', err.original);
        if (err.parent) console.error('Parent error:', err.parent);
        if (err.sql) console.error('Failed SQL:', err.sql);
      } catch (logErr) {
        console.error('Failed to log error details in softDeletePurchase:', logErr && logErr.message ? logErr.message : logErr);
      }

      // Re-throw a clearer error message
      throw new Error(`Failed to delete purchase: ${err.message || err}`);
    }
  }

  async _reverseStockQuantities(purchase, transaction) {
    // Reverse stock quantities for all items in this purchase
    const warnings = [];
    for (const item of purchase.items) {
      const inventoryLevel = await this.InventoryLevel.findOne({
        where: { product_id: item.product_id },
        transaction
      });

      if (!inventoryLevel) {
        // If still missing, skip and warn (shouldn't happen because preflight created missing rows)
        warnings.push(`InventoryLevel missing for product ${item.product_id}; skipped reversal.`);
        continue;
      }

      const currentStock = parseFloat(inventoryLevel.quantity_on_hand) || 0;
      const purchaseQuantity = parseFloat(item.quantity) || 0;
      let newStock = currentStock - purchaseQuantity;

      if (newStock < 0) {
        // Clamp to zero and warn. We avoid throwing to prevent transaction aborts on legacy data.
        warnings.push(`Negative stock avoided for product ${item.product_id}: current ${currentStock}, removing ${purchaseQuantity}. Stock set to 0.`);
        newStock = 0;
      }

      try {
        await inventoryLevel.update({ quantity_on_hand: newStock }, { transaction });
      } catch (updateErr) {
        warnings.push(`Failed to update stock for product ${item.product_id}: ${updateErr.message}`);
      }
    }

    return warnings;
  }

  async restorePurchase(purchaseId) {
    const purchase = await this.Purchase.findByPk(purchaseId);

    if (!purchase) throw new Error('Purchase not found');
    if (purchase.status !== 'Deleted') throw new Error('Purchase is not deleted');

    // Restore purchase to Draft status
    await purchase.update({
      status: 'Draft',
      deleted_at: null
    });

    return this.getPurchaseById(purchase.id);
  }

  // --- Updated List Methods with Soft Delete Support ---

  async listPurchases(filters = {}) {
    console.log('Second listPurchases called with filters:', filters);
    const whereClause = {};

    // Handle status filtering
    if (filters.status) {
      if (filters.status === 'active') {
        // Active POs exclude deleted ones
        whereClause.status = { [Op.ne]: 'Deleted' };
      } else if (filters.status === 'deleted') {
        // Only deleted POs
        whereClause.status = 'Deleted';
      } else {
        // Specific status
        whereClause.status = filters.status;
      }
    }
    // If no status filter provided, return ALL purchases (including deleted) for client-side filtering

    // Add other filters
    if (filters.vendor_id) whereClause.vendor_id = filters.vendor_id;
    if (filters.invoice_number) whereClause.invoice_number = { [Op.iLike]: `%${filters.invoice_number}%` };

    return this.Purchase.findAll({
      where: whereClause,
      include: [
        { model: this.Vendor, attributes: ['id', 'name', 'gst_number', 'state'] },
        { model: this.PurchaseItem, as: 'items', include: [{ model: this.Product, attributes: ['id', 'name', 'hsn_code'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }
}