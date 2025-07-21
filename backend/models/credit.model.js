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
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Partner',
    },
  });

  // Only CreditAccount is used for credit info; user management is handled by main User/Role tables
  return { CreditAccount };
}; 