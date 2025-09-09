import { Sequelize, DataTypes } from 'sequelize';

export const initTenantModels = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: { type: DataTypes.STRING(50), primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    // Permanent default MANAGER shift assignment for fuel-admin users
    default_manager_shift_id: { type: DataTypes.INTEGER, allowNull: true }
  });

  const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false }
  });

  const UserDetails = sequelize.define('UserDetails', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    postal_code: { type: DataTypes.STRING, allowNull: true },
    gstin: { type: DataTypes.STRING, allowNull: true }
  });

  const OperatorGroup = sequelize.define('OperatorGroup', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }, // e.g., "Frontage Cash Counter"
    cashier_id: { type: DataTypes.STRING(50), allowNull: false },
    // New: tie a group to a specific WORKER shift template
    shift_id: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['cashier_id', 'shift_id']
      }
    ]
  });

  const RefreshToken = sequelize.define('RefreshToken', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.STRING(50), allowNull: false, references: { model: 'Users', key: 'user_id' } },
    token: { type: DataTypes.TEXT, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
    bunk_id: { type: DataTypes.STRING(50), allowNull: false } // Add bunk_id
  });

  // Associations
  Role.hasMany(User, { foreignKey: 'role_id' });
  User.belongsTo(Role, { foreignKey: 'role_id' });
  User.hasOne(UserDetails, { foreignKey: 'user_id', as: 'UserDetails' });
  UserDetails.belongsTo(User, { foreignKey: 'user_id' });
  User.hasMany(RefreshToken, { foreignKey: 'user_id' });
  RefreshToken.belongsTo(User, { foreignKey: 'user_id' });
  // Operator Group
  // Cashier (one) owns an OperatorGroup
  OperatorGroup.belongsTo(User, { foreignKey: 'cashier_id', targetKey: 'user_id', as: 'Cashier' });
  // Note: Cross-model associations are set up centrally in models/associations.js
  // after all models are initialized to ensure proper association creation

  return { User, Role, UserDetails, RefreshToken, OperatorGroup };
};