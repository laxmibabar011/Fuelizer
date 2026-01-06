import { DataTypes } from 'sequelize'

// Initializes Product, Category, and Inventory models in a tenant database.
// This new structure separates master data from transactional inventory data.
export const initProductModels = (sequelize) => {

  // --- Helper Tables for Normalization ---

  const ProductCategory = sequelize.define('ProductCategory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    category_type: { type: DataTypes.ENUM('Fuel', 'Non-Fuel'), allowNull: false, defaultValue: 'Non-Fuel' },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  })

  const UnitOfMeasure = sequelize.define('UnitOfMeasure', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g., "Litre", "Piece", "Kilogram"
    code: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g., "LTR", "PCS", "KG"
  })

  // --- The Core Product Master Table ---

  const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    item_code: { type: DataTypes.STRING, allowNull: false, unique: true }, // Product code like "D", "H2", "P", "AP31"
    product_code: { type: DataTypes.STRING, allowNull: true, unique: true }, // Legacy field for compatibility
    hsn_code: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    image_url: { type: DataTypes.STRING, allowNull: true },
    
    // Foreign Keys
    category_id: { type: DataTypes.INTEGER, references: { model: ProductCategory, key: 'id' } },
    uom_id: { type: DataTypes.INTEGER, references: { model: UnitOfMeasure, key: 'id' } },

    // Pricing Information
    sales_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00, comment: 'Sale Rate' },
    cost_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00, comment: 'Cost Price for purchase' },
    
    // --- ENHANCED TAX SECTION FOR DETAILED GST BREAKDOWN ---
    taxability: { 
      type: DataTypes.ENUM('taxable', 'exempt', 'nil_rated', 'non_gst'), 
      allowNull: false, 
      defaultValue: 'taxable' 
    },
    gst_rate: { 
      type: DataTypes.DECIMAL(5, 2), 
      allowNull: false, 
      defaultValue: 0.00,
      comment: 'Total GST rate for display purposes'
    },
    // Detailed GST breakdown for accurate tax calculations
    cgst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'CGST rate (half of total GST for intra-state)'
    },
    sgst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'SGST rate (half of total GST for intra-state)'
    },
    igst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'IGST rate (for inter-state transactions)'
    },
    cess_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Cess percentage'
    },
    tcs_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'TCS (Tax Collected at Source) rate'
    },
    
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
  })

  // --- The SEPARATE Inventory Table ---
  // THIS IS THE MOST IMPORTANT CHANGE.
  // This table tracks stock for non-fuel items (lubricants, etc.).
  // Fuel stock will be tracked in a separate 'Tanks' module.
  
  const InventoryLevel = sequelize.define('InventoryLevel', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: Product, key: 'id' } },
    quantity_on_hand: { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 0, comment: 'Current stock quantity' },
    opening_stock: { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 0, comment: 'Opening stock quantity' },
    stock_value: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, comment: 'Current stock value at cost price' },
    opening_stock_value: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, comment: 'Opening stock value' },
    reorder_level: { type: DataTypes.DECIMAL(10, 3), allowNull: true, comment: 'Reorder level quantity' },
    reorder_value: { type: DataTypes.DECIMAL(12, 2), allowNull: true, comment: 'Reorder level value' },
  })


  // --- Defining Relationships ---

  ProductCategory.hasMany(Product, { foreignKey: 'category_id' })
  Product.belongsTo(ProductCategory, { foreignKey: 'category_id' })

  UnitOfMeasure.hasMany(Product, { foreignKey: 'uom_id' })
  Product.belongsTo(UnitOfMeasure, { foreignKey: 'uom_id' })
  
  Product.hasOne(InventoryLevel, { foreignKey: 'product_id', onDelete: 'CASCADE' })
  InventoryLevel.belongsTo(Product, { foreignKey: 'product_id' })

  return { ProductCategory, UnitOfMeasure, Product, InventoryLevel }
}