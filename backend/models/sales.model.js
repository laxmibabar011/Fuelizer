import { DataTypes } from 'sequelize'

// Initializes the Sales model with Excel-parity columns plus minimal system fields.
// This is a flat table by design to match the JobySoft export while preserving
// essential metadata for multi-tenant integrity and reconciliation.
export const initSalesModels = (sequelize) => {

  const Sales = sequelize.define('Sales', {
    // --- System fields ---
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT, allowNull: true },
    source: { type: DataTypes.ENUM('POS', 'Manual', 'Import'), allowNull: false, defaultValue: 'Manual' },
    shift_id: { type: DataTypes.BIGINT, allowNull: true },
    product_id: { type: DataTypes.BIGINT, allowNull: true },
    payment_method_id: { type: DataTypes.INTEGER, allowNull: true },
    product_type: { type: DataTypes.ENUM('Fuel', 'NonFuel'), allowNull: true },
    status: { type: DataTypes.ENUM('Draft', 'Posted', 'Adjusted', 'Cancelled'), allowNull: false, defaultValue: 'Posted' },
    pos_txn_ids: { type: DataTypes.JSONB || DataTypes.JSON, allowNull: true },
    import_batch_id: { type: DataTypes.STRING(64), allowNull: true },
    idempotency_key: { type: DataTypes.STRING(128), allowNull: true, unique: true },
    created_by_id: { type: DataTypes.BIGINT, allowNull: true },
    posted_by_id: { type: DataTypes.BIGINT, allowNull: true },
    posted_at: { type: DataTypes.DATE, allowNull: true },

    // --- Excel-parity columns ---
    Date: { type: DataTypes.DATEONLY, allowNull: false },
    BillNo: { type: DataTypes.STRING(30), allowNull: false },
    'Bill Mode': { type: DataTypes.STRING(30), allowNull: false },
    'Party Name': { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'Cash' },
    'Registration Type': { type: DataTypes.STRING(60), allowNull: true },
    GSTIN: { type: DataTypes.STRING(20), allowNull: true },
    'Item Name': { type: DataTypes.STRING(120), allowNull: false },
    Qty: { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0 },
    Rate: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    Amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    'GST Rate': { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    'Taxable Value': { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    SGST: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    CGST: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    IGST: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    'Cess Rate': { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    'Cess Amt': { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    'TCS Rate': { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    'TCS Amt': { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    'Invoice Value': { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  }, {
    tableName: 'sales',
    indexes: [
      { fields: ['Date'] },
      { fields: ['BillNo'], unique: false },
      { fields: ['payment_method_id'] },
      { fields: ['Item Name'] },
    ]
  })

  // Define associations - only if PaymentMethod model exists
  if (sequelize.models.PaymentMethod) {
    Sales.belongsTo(sequelize.models.PaymentMethod, { 
      foreignKey: 'payment_method_id', 
      as: 'PaymentMethod' 
    })
  }

  return { Sales }
}


