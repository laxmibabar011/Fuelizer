import { DataTypes } from 'sequelize';

export const initCreditModels = (sequelize) => {
  const CreditAccount = sequelize.define('CreditAccount', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyName: { type: DataTypes.STRING, allowNull: false },
    contactName: { type: DataTypes.STRING, allowNull: false },
    contactEmail: { type: DataTypes.STRING, unique: true, allowNull: false },
    contactPhone: { type: DataTypes.STRING, unique: true, allowNull: false },
    creditLimit: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Active'
    }
  });

  const Vehicle = sequelize.define('Vehicle', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    partnerId: { type: DataTypes.INTEGER, allowNull: false },
    vehicleNumber: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING },
    capacity: { type: DataTypes.STRING },
    fuelType: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Active' }
  });

  Vehicle.belongsTo(CreditAccount, { foreignKey: 'partnerId' });
  CreditAccount.hasMany(Vehicle, { foreignKey: 'partnerId' });

  return { CreditAccount, Vehicle };
};