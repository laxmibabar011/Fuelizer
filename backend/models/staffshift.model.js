import { DataTypes } from 'sequelize';

export const initStaffShiftModels = (sequelize) => {
  // Operator model
  const Operator = sequelize.define('Operator', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    operator_id: { type: DataTypes.STRING(10), allowNull: false, unique: true }, // e.g., "OP001"
    user_id: { type: DataTypes.STRING(50), allowNull: false }, // Link to User table
    duty: { type: DataTypes.ENUM('cashier', 'attendant'), allowNull: false, defaultValue: 'attendant' },
    status: { type: DataTypes.ENUM('available', 'assigned', 'unavailable'), defaultValue: 'available' },
    join_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });

  // Shift model
  const Shift = sequelize.define('Shift', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }, // e.g., "Morning Shift"
    shift_type: { type: DataTypes.ENUM('MANAGER', 'WORKER'), allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false }, // e.g., "06:00"
    end_time: { type: DataTypes.TIME, allowNull: false }, // e.g., "14:00"
    max_operators: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });

  // Shift Assignment model
  const ShiftAssignment = sequelize.define('ShiftAssignment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    date: { type: DataTypes.DATEONLY, allowNull: false }, // YYYY-MM-DD
    shift_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.STRING(50), allowNull: false },
    assigned_by: { type: DataTypes.STRING(50), allowNull: true }, // user_id of who made assignment
    status: { type: DataTypes.ENUM('assigned', 'checked-in', 'checked-out', 'absent'), defaultValue: 'assigned' },
    check_in_time: { type: DataTypes.DATE, allowNull: true },
    check_out_time: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });

  // Operator Group Booth model
  const OperatorGroupBooth = sequelize.define('OperatorGroupBooth', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    operator_group_id: { type: DataTypes.INTEGER, allowNull: false },
    booth_id: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['operator_group_id', 'booth_id']
      }
    ]
  });

  // Operator Group Member model (junction table for User-OperatorGroup many-to-many)
  const OperatorGroupMember = sequelize.define('OperatorGroupMember', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    operator_group_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.STRING(50), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['operator_group_id', 'user_id']
      }
    ]
  });

  // Associations
  Operator.belongsTo(sequelize.models.User, { foreignKey: 'user_id', targetKey: 'user_id', as: 'User' });
  Operator.belongsTo(sequelize.models.UserDetails, { foreignKey: 'user_id', targetKey: 'user_id', as: 'UserDetails' });
  
  Shift.hasMany(ShiftAssignment, { foreignKey: 'shift_id', as: 'Assignments' });
  ShiftAssignment.belongsTo(Shift, { foreignKey: 'shift_id', as: 'Shift' });
  // ShiftAssignment links to User, not Operator, via user_id
  ShiftAssignment.belongsTo(sequelize.models.User, { foreignKey: 'user_id', targetKey: 'user_id', as: 'User' });
  ShiftAssignment.belongsTo(sequelize.models.UserDetails, { foreignKey: 'user_id', targetKey: 'user_id', as: 'UserDetails' });

  // OperatorGroupBooth associations
  OperatorGroupBooth.belongsTo(sequelize.models.OperatorGroup, { foreignKey: 'operator_group_id', as: 'OperatorGroup' });
  OperatorGroupBooth.belongsTo(sequelize.models.Booth, { foreignKey: 'booth_id', as: 'Booth' });

  // OperatorGroupMember associations (many-to-many between User and OperatorGroup)
  OperatorGroupMember.belongsTo(sequelize.models.OperatorGroup, { foreignKey: 'operator_group_id', as: 'OperatorGroup' });
  OperatorGroupMember.belongsTo(sequelize.models.User, { foreignKey: 'user_id', targetKey: 'user_id', as: 'User' });
  OperatorGroupMember.belongsTo(sequelize.models.UserDetails, { foreignKey: 'user_id', targetKey: 'user_id', as: 'UserDetails' });

  return { Operator, Shift, ShiftAssignment, OperatorGroupBooth, OperatorGroupMember };
}; 