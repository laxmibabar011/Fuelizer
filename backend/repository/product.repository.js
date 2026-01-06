import { initProductModels } from '../models/product.model.js' // <-- Use the new model initializer
import { Op } from 'sequelize'

export class ProductRepository {
  constructor(sequelize) {
    // Initialize all related models
    const { Product, ProductCategory, UnitOfMeasure, InventoryLevel } = initProductModels(sequelize)
    this.Product = Product
    this.ProductCategory = ProductCategory
    this.UnitOfMeasure = UnitOfMeasure
    this.InventoryLevel = InventoryLevel
    this.sequelize = sequelize // <-- Store sequelize instance for transactions
  }

  // --- Categories ---
  async createCategory(payload) {
    return this.ProductCategory.create(payload)
  }

  async listCategories(filter = {}) {
    return this.ProductCategory.findAll({ where: filter, order: [['name', 'ASC']] })
  }

  async getCategoryById(id) {
    return this.ProductCategory.findByPk(id)
  }

  async updateCategory(id, patch) {
    const category = await this.getCategoryById(id)
    if (!category) return null
    await category.update(patch)
    return category
  }

  async deleteCategory(id) {
    const category = await this.getCategoryById(id)
    if (!category) return 0
    // Soft delete: mark as inactive
    await category.update({ is_active: false })
    return 1
  }

  // --- Units of Measure (UoM) ---
  async createUom(payload) {
    return this.UnitOfMeasure.create(payload)
  }

  async listUoms() {
    return this.UnitOfMeasure.findAll({ order: [['name', 'ASC']] })
  }


  // --- Products ---
  async createProduct(payload) {
    // **CRITICAL CHANGE**: Use a transaction to create a Product AND its InventoryLevel record.
    const t = await this.sequelize.transaction()
    try {
      // 1. Create the main product record
      const product = await this.Product.create(payload, { transaction: t })

      // 2. Create inventory level record for all products
      const openingStock = payload.opening_stock || 0
      const costPrice = payload.cost_price || 0
      const openingStockValue = openingStock * costPrice
      
      await this.InventoryLevel.create({
        product_id: product.id,
        quantity_on_hand: openingStock, // Set to opening stock
        opening_stock: openingStock,
        stock_value: openingStockValue,
        opening_stock_value: openingStockValue,
        reorder_level: payload.reorder_level || 0,
        reorder_value: (payload.reorder_level || 0) * costPrice
      }, { transaction: t })

      // 3. If everything is successful, commit the transaction
      await t.commit()
      return product

    } catch (error) {
      // 4. If anything fails, roll back the transaction
      await t.rollback()
      throw error // Re-throw the error to be caught by the controller
    }
  }

  async listProducts(query = {}) {
    const { category_id, status } = query
    const where = {}
    if (category_id) where.category_id = category_id
    if (status) where.status = status

    // **CRITICAL CHANGE**: Use `include` to JOIN related tables
    return this.Product.findAll({
      where,
      include: [
        { model: this.ProductCategory, attributes: ['name', 'category_type'] },
        { model: this.UnitOfMeasure, attributes: ['name', 'code'] },
        { model: this.InventoryLevel, attributes: ['quantity_on_hand', 'reorder_level'], required: false } // LEFT JOIN
      ],
      order: [['name', 'ASC']]
    })
  }

  // New method specifically for purchase module - returns products with tax information
  async getProductsForPurchase(query = {}) {
    const { category_id, status } = query
    const where = { status: 'active' } // Only active products for purchase
    if (category_id) where.category_id = category_id
    if (status) where.status = status

    return this.Product.findAll({
      where,
      attributes: [
        'id', 'name', 'item_code', 'product_code', 'hsn_code', 
        'sales_price', 'cost_price',
        'taxability', 'gst_rate', 'cgst_rate', 'sgst_rate', 'igst_rate', 'cess_rate', 'tcs_rate'
      ],
      include: [
        { model: this.ProductCategory, attributes: ['name', 'category_type'] },
        { model: this.UnitOfMeasure, attributes: ['name', 'code'] },
        { 
          model: this.InventoryLevel, 
          attributes: [
            'quantity_on_hand', 'opening_stock', 'stock_value', 'opening_stock_value',
            'reorder_level', 'reorder_value'
          ], 
          required: false 
        }
      ],
      order: [['item_code', 'ASC']]
    })
  }

  async getProductById(id) {
    // Also use `include` for getting a single product
    return this.Product.findByPk(id, {
      include: [
        { model: this.ProductCategory, attributes: ['name', 'category_type'] },
        { model: this.UnitOfMeasure, attributes: ['name', 'code'] },
        { model: this.InventoryLevel, attributes: ['quantity_on_hand', 'reorder_level'], required: false }
      ]
    })
  }

  async updateProduct(id, patch) {
    const product = await this.Product.findByPk(id)
    if (!product) return null
    await product.update(patch)
    return product
  }
  
  async deleteProduct(id) {
    const product = await this.Product.findByPk(id)
    if (!product) return 0
    await product.update({ status: 'inactive' })
    return 1
  }

  // --- Inventory ---
  async getInventoryLevels() {
      return this.InventoryLevel.findAll({
          include: [{ model: this.Product, attributes: ['name', 'product_code'] }],
          order: [[this.Product, 'name', 'ASC']]
      });
  }

  async adjustInventory(productId, newQuantity, reason = 'Manual Adjustment') {
      // This is a simplified adjustment. A real-world scenario would log this change in an audit table.
      const inventoryItem = await this.InventoryLevel.findOne({ where: { product_id: productId }});
      if (!inventoryItem) {
          throw new Error('Inventory record not found for this product.');
      }
      inventoryItem.quantity_on_hand = newQuantity;
      await inventoryItem.save();
      return inventoryItem;
  }
}