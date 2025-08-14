import { DataTypes } from 'sequelize'

// Initializes Product Master models in a tenant database
// Exposed model names: ProductCategory, ProductMaster
export const initProductMasterModels = (sequelize) => {
  const ProductCategory = sequelize.define('ProductCategory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    category_type: { type: DataTypes.ENUM('Fuel', 'Other Product'), allowNull: false },
    name: { type: DataTypes.STRING, allowNull: true }, // Hidden for Fuel type
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  })

  const ProductMaster = sequelize.define('ProductMaster', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    category_type: { type: DataTypes.ENUM('Fuel', 'Other Product'), allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: true }, // nullable for Fuel
    name: { type: DataTypes.STRING, allowNull: false },
    supplier: { type: DataTypes.STRING, allowNull: true },
    uom: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Liter' },
    hsn: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    image_url: { type: DataTypes.STRING, allowNull: true },
    // Pricing/inventory (nullable for Fuel)
    mrp: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    sale_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    stock: { type: DataTypes.INTEGER, allowNull: true },
    reorder_level: { type: DataTypes.INTEGER, allowNull: true },
    discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    // Taxes
    cgst: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    igst: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    sgst: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    vat: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    sac: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
  })

  ProductCategory.hasMany(ProductMaster, { foreignKey: 'category_id', onDelete: 'SET NULL' })
  ProductMaster.belongsTo(ProductCategory, { foreignKey: 'category_id' })

  return { ProductCategory, ProductMaster }
}


