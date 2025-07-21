import { DataTypes } from 'sequelize';

export const initMasterModels = (sequelize) => {
  // Super Admin and Client login credentials
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false }, // 'super_admin', 'fuel-admin', etc.
    client_id: { type: DataTypes.INTEGER, allowNull: true }, // null for super admin
    access_token: { type: DataTypes.TEXT, allowNull: true }, // Store current access token
  });

  // Client metadata (onboarding fields)
  const Client = sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    client_key: { type: DataTypes.STRING, unique: true, allowNull: false },
    client_name: { type: DataTypes.STRING, allowNull: false },
    client_owner_name: { type: DataTypes.STRING, allowNull: false },
    client_address: { type: DataTypes.STRING, allowNull: true },
    client_city: { type: DataTypes.STRING, allowNull: true },
    client_state: { type: DataTypes.STRING, allowNull: true },
    client_country: { type: DataTypes.STRING, allowNull: true },
    client_pincode: { type: DataTypes.STRING, allowNull: true },
    gst_number: { type: DataTypes.STRING, allowNull: true },
    client_phone: { type: DataTypes.STRING, allowNull: true },
    client_email: { type: DataTypes.STRING, allowNull: false },
    db_name: { type: DataTypes.STRING, unique: true, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, default: true },
  });
  
  // PasswordReset model for OTP-based password reset (for all users, multi-tenant aware)
  // Used for forgot password flow
  const PasswordReset = sequelize.define('PasswordReset', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    otp: { type: DataTypes.STRING, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  // Relations
  Client.hasMany(User, { foreignKey: 'client_id' });
  User.belongsTo(Client, { foreignKey: 'client_id' });
  // PasswordReset belongs to User
  PasswordReset.belongsTo(User, { foreignKey: 'user_id' });
  User.hasMany(PasswordReset, { foreignKey: 'user_id' });

  return { User, Client, PasswordReset };
};