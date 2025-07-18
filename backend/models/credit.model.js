import { DataTypes } from 'sequelize';
import { hashPassword } from '../util/auth.util.js';

export const initCreditModels = (sequelize) => {
  // CreditCustomer model
  const CreditCustomer = sequelize.define('CreditCustomer', {
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

  // CustomerUser model
  const CustomerUser = sequelize.define('CustomerUser', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    isApprover: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    creditCustomerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: CreditCustomer,
        key: 'id',
      },
    },
  });

  // Password hashing hook for CustomerUser
  // CustomerUser.beforeCreate(async (user) => {
  //   if (user.password) {
  //     user.password = await hashPassword(user.password);
  //   }
  // });

  // Relationship: CreditCustomer has many CustomerUsers
  CreditCustomer.hasMany(CustomerUser, { foreignKey: 'creditCustomerId' });
  CustomerUser.belongsTo(CreditCustomer, { foreignKey: 'creditCustomerId' });

  return { CreditCustomer, CustomerUser };
}; 