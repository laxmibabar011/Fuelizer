import { DataTypes } from 'sequelize';

// Initializes Station Setup related models within a tenant database
// Booth (Dispensing Unit), Nozzle, and minimal Product reference for fuel mapping
export const initStationModels = (sequelize) => {
  const Booth = sequelize.define('Booth', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  });

  // For backward compatibility we keep a minimal Product reference used by Nozzle
  // But this will be populated from Product Master (Fuel category only)
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true }, // 'Fuel'
  });

  const Nozzle = sequelize.define('Nozzle', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    boothId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: true }, // mapped fuel product
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' }, // 'active' | 'inactive'
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  Booth.hasMany(Nozzle, { foreignKey: 'boothId', onDelete: 'CASCADE' });
  Nozzle.belongsTo(Booth, { foreignKey: 'boothId' });

  Product.hasMany(Nozzle, { foreignKey: 'productId' });
  Nozzle.belongsTo(Product, { foreignKey: 'productId' });

  return { Booth, Nozzle, Product };
};


