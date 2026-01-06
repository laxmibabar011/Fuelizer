import { DataTypes } from 'sequelize';

// Initializes the revamped Purchase Module models.
// Models: Vendor, Purchase, PurchaseItem
export const initPurchaseModels = (sequelize) => {
  
  // The Vendor model is largely okay, with minor cleanups.
  const Vendor = sequelize.define('Vendor', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    gst_number: { type: DataTypes.STRING, allowNull: true },
    contact_person: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
    address: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
    // Optional extended fields
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Karnataka', comment: 'State for GST calculations (mandatory for Indian GST compliance)' },
    pincode: { type: DataTypes.STRING, allowNull: true },
    customer_id: { type: DataTypes.STRING, allowNull: true },
    aadhaar_number: { type: DataTypes.STRING, allowNull: true },
    pan: { type: DataTypes.STRING, allowNull: true },
    bank_name: { type: DataTypes.STRING, allowNull: true },
    account_number: { type: DataTypes.STRING, allowNull: true },
    ifsc_code: { type: DataTypes.STRING, allowNull: true },
    cheque_number: { type: DataTypes.STRING, allowNull: true },
    area_route: { type: DataTypes.STRING, allowNull: true },
    tin: { type: DataTypes.STRING, allowNull: true },
  });

  // Renamed from PurchaseOrder to Purchase for clarity. This represents a received invoice.
  const Purchase = sequelize.define('Purchase', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    vendor_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Vendor, key: 'id' } },
    
    // Invoice details
    invoice_number: { type: DataTypes.STRING, allowNull: false },
    invoice_date: { type: DataTypes.DATEONLY, allowNull: false },
    stock_received_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    
    // Corrected payment modes
    payment_mode: { type: DataTypes.ENUM('Cash', 'Credit', 'Bank Transfer'), allowNull: false, defaultValue: 'Credit' },
    notes: { type: DataTypes.TEXT, allowNull: true },

    // Financial Totals
    subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    taxable_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    other_charges: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'e.g., freight, loading' },
    cgst_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    sgst_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    igst_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    cess_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    cess_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 }, // This is the Net Amount

  // Status is key for triggering inventory updates
  status: { type: DataTypes.ENUM('Draft', 'Stock Updated', 'Cancelled', 'Deleted'), allowNull: false, defaultValue: 'Draft' },
  deleted_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null }, // Soft delete timestamp
  created_by_id: { type: DataTypes.INTEGER, allowNull: true }, // Foreign key to a User model
  });

  // Renamed from PurchaseOrderItem to PurchaseItem
  const PurchaseItem = sequelize.define('PurchaseItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    purchase_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Purchase, key: 'id' } },
    product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Products', key: 'id' } }, // Link to our Product model
    
    // Denormalized fields for historical accuracy
    product_name_at_purchase: { type: DataTypes.STRING, allowNull: false }, 
    hsn_code_at_purchase: { type: DataTypes.STRING, allowNull: true },
    
    // Core purchase data
    quantity: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    purchase_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    
    // Line item financials
    line_total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    taxable_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    gst_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    cgst_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    sgst_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    igst_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    cess_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  });

  // --- Associations ---
  Vendor.hasMany(Purchase, { foreignKey: 'vendor_id', onDelete: 'RESTRICT' });
  Purchase.belongsTo(Vendor, { foreignKey: 'vendor_id' });

  Purchase.hasMany(PurchaseItem, { as: 'items', foreignKey: 'purchase_id', onDelete: 'CASCADE' });
  PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id' });
  
  // We need to define this association in the main association setup file
  // Product.hasMany(PurchaseItem, { foreignKey: 'product_id' });
  PurchaseItem.belongsTo(sequelize.models.Product, { foreignKey: 'product_id' });


  return { Vendor, Purchase, PurchaseItem };
};