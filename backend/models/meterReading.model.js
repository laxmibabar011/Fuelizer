import { DataTypes } from 'sequelize';

export const initMeterReadingModel = (sequelize) => {
  const MeterReading = sequelize.define('MeterReading', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    shift_ledger_id: { type: DataTypes.INTEGER, allowNull: false },
    nozzle_id: { type: DataTypes.INTEGER, allowNull: false },
    opening_reading: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    test_litres: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    closing_reading: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    calculated_sales_litres: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  });

  // Set up associations after models are defined
  // These will be set up in the model initialization process

  return { MeterReading };
};