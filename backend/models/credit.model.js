import { DataTypes } from 'sequelize';

export const initCreditModels = (sequelize) => {
  // CreditAccount model (formerly CreditCustomer)
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
      defaultValue: 'Active',
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Partner',
    },
  });

  const Vehicle = sequelize.define('Vehicle', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    partnerId: { type: DataTypes.INTEGER, allowNull: false }, // FK to CreditAccount
    vehicleNumber: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING },
    capacity: { type: DataTypes.STRING },
    fuelType: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Active' },
  });
  Vehicle.belongsTo(CreditAccount, { foreignKey: 'partnerId' });
  CreditAccount.hasMany(Vehicle, { foreignKey: 'partnerId' });

  // Only CreditAccount is used for credit info; user management is handled by main User/Role tables
  return { CreditAccount , Vehicle };
}; 