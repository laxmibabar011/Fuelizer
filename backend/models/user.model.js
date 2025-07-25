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

  const UserDetails = sequelize.define('UserDetails', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    postal_code: { type: DataTypes.STRING, allowNull: true },
    gstin: { type: DataTypes.STRING, allowNull: true },
  });

  // Relations
  Role.hasMany(User, { foreignKey: 'role_id' });
  User.belongsTo(Role, { foreignKey: 'role_id' });
  User.hasOne(UserDetails, { foreignKey: 'user_id' });
  UserDetails.belongsTo(User, { foreignKey: 'user_id' });
 

  return { User, Role, UserDetails };
};