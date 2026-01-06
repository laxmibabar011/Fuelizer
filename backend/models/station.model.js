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

  const Nozzle = sequelize.define('Nozzle', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    boothId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false }, // Explicitly set length to 20 characters
    productId: { type: DataTypes.INTEGER, allowNull: true }, // mapped fuel product
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' }, // 'active' | 'inactive'
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  Booth.hasMany(Nozzle, { foreignKey: 'boothId', as: 'Nozzles', onDelete: 'CASCADE' });
  Nozzle.belongsTo(Booth, { foreignKey: 'boothId' });

  // Link Nozzle to the main Product model defined in product.model.js
  if (sequelize.models.Product) {
    sequelize.models.Product.hasMany(Nozzle, { foreignKey: 'productId' });
    Nozzle.belongsTo(sequelize.models.Product, { foreignKey: 'productId', as: 'Product' });
  }

  return { Booth, Nozzle };
};


