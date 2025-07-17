import { DataTypes } from 'sequelize';

export const initTenantModels = (sequelize) => {
  // Tenant user
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    access_token: { type: DataTypes.TEXT, allowNull: true }, // Store current access token
  });

  // Tenant role
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
  });

  // Relations
  Role.hasMany(User, { foreignKey: 'role_id' });
  User.belongsTo(Role, { foreignKey: 'role_id' });

  return { User, Role };
};