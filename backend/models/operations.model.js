import { DataTypes } from 'sequelize';

export const initOperationModels = (sequelize) => {
  // This model represents a single business day.
  const OperationalDay = sequelize.define('OperationalDay', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    business_date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('OPEN', 'CLOSED'), defaultValue: 'OPEN' },
  });

  // This model represents an active, running shift by a manager.
  // It's the parent record for all transactions and meter readings during that shift.
  const ShiftLedger = sequelize.define('ShiftLedger', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    operational_day_id: { type: DataTypes.INTEGER, allowNull: false },
    shift_master_id: { type: DataTypes.INTEGER, allowNull: false }, // The shift definition
    fuel_admin_id: { type: DataTypes.STRING(50), allowNull: false }, // The manager on duty
    status: { type: DataTypes.ENUM('ACTIVE', 'ENDED'), defaultValue: 'ACTIVE' },
    opening_cash: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    closing_cash: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ended_at: { type: DataTypes.DATE, allowNull: true },
  });

  // Associations
  OperationalDay.hasMany(ShiftLedger, { foreignKey: 'operational_day_id' });
  ShiftLedger.belongsTo(OperationalDay, { foreignKey: 'operational_day_id' });

  ShiftLedger.belongsTo(sequelize.models.Shift, { foreignKey: 'shift_master_id' });
  ShiftLedger.belongsTo(sequelize.models.User, { as: 'FuelAdmin', foreignKey: 'fuel_admin_id' });

  return { OperationalDay, ShiftLedger };
};