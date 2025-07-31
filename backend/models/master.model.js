import { DataTypes } from 'sequelize';

export const initMasterModels = (sequelize) => {
  // Super Admin login credentials
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'super_admin' },
    refresh_token: { type: DataTypes.STRING, allowNull: true }, // Store refresh token
    refresh_token_expires_at: { type: DataTypes.DATE, allowNull: true }, // Expiration
    refresh_token_revoked: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false } // Revocation status
  });

  // Client metadata (onboarding fields)
  const Client = sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    client_id: { type: DataTypes.STRING(50), unique: true, allowNull: false },
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
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  });

  // PasswordReset model for OTP-based password reset
  const PasswordReset = sequelize.define('PasswordReset', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.STRING(50), allowNull: false }, // Matches tenant_db.User.user_id or super_admin id
    client_id: { type: DataTypes.STRING(50), allowNull: true }, // null for super-admin
    otp: { type: DataTypes.STRING, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, defaultValue: false }
  });

  return { User, Client, PasswordReset };
};