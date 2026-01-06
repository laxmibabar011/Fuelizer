import { DataTypes } from 'sequelize'

// Initializes Decantation Logs models in a tenant database
// Exposed model names: DecantationTable, DecantationEntry, DecantationEntryData
export const initDecantationLogsModels = (sequelize) => {
  // Table configuration model - stores the structure of tables
  const DecantationTable = sequelize.define('DecantationTable', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    kind: { type: DataTypes.ENUM('matrix', 'fixed-columns'), allowNull: false },
    // For matrix tables
    rows: { type: DataTypes.JSON, allowNull: true }, // Array of row labels
    cols: { type: DataTypes.JSON, allowNull: true }, // Array of column labels
    // For fixed-columns tables
    rowLabels: { type: DataTypes.JSON, allowNull: true }, // Array of row labels
    columns: { type: DataTypes.JSON, allowNull: true }, // Array of column labels
    columnsLocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  })

  // Main entry model - stores daily decantation entries with fixed header fields and table data
  const DecantationEntry = sequelize.define('DecantationEntry', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // Fixed header fields as required
    date_id: { type: DataTypes.DATEONLY, allowNull: false }, // YYYY-MM-DD format
    invoice_no: { type: DataTypes.STRING, allowNull: false }, // Invoice number
    load_details: { type: DataTypes.STRING, allowNull: false }, // Load details
    tt_arrival_time: { type: DataTypes.STRING, allowNull: false }, // Tanker arrival time
    // Configurable table data stored as JSON
    table_data: { type: DataTypes.JSON, allowNull: false, defaultValue: {} }, // Contains all configurable table values
    // Metadata
    created_by: { type: DataTypes.STRING, allowNull: true }, // User ID who created
    updated_by: { type: DataTypes.STRING, allowNull: true }, // User ID who last updated
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  })

  return {
    DecantationTable,
    DecantationEntry
  }
}
