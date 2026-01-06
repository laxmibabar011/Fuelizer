import { DataTypes } from 'sequelize';

export const initTransactionModels = (sequelize) => {

  const PaymentMethod = sequelize.define('PaymentMethod', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, unique: true, allowNull: false }, // e.g., "Cash", "Paytm"
        bill_mode: { 
          type: DataTypes.STRING(20), 
          allowNull: false, 
          defaultValue: 'cash',
          validate: {
            isIn: [['cash', 'credit', 'card', 'cash_party']]
          },
          comment: 'Bill mode: cash, credit, card, or cash_party'
        },
        party_name_strategy: {
          type: DataTypes.ENUM('fixed', 'credit_customer'),
          allowNull: false,
          defaultValue: 'fixed',
          // Removed comment to avoid invalid COMMENT ... USING during alter
        },
        default_party_name: { type: DataTypes.STRING(120), allowNull: true },
        party_name_uppercase: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
   });

  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.BIGINT, // Use BIGINT as this table will grow very large
      autoIncrement: true,
      primaryKey: true,
    },
    operator_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'The user_id of the OPERATOR who recorded the sale.',
    },
    nozzle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The nozzle used for this transaction.',
    },
    litres_sold: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      comment: 'Quantity of fuel sold in litres.',
    },
    price_per_litre_at_sale: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      comment: 'The fuel rate at the exact moment of the sale.',
    },
    total_amount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      comment: 'Total sale amount (litres * price).',
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Links to your new custom PaymentMethods table.',
    },
    credit_customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // This will only have a value if the payment method is 'Credit Party'
      comment: 'Links to the credit customer if this was a credit sale.',
    },
    operator_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Links to the operator group for better traceability.',
    },
    transaction_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'The exact timestamp of the sale.',
    },
  });

  // Bind Associations to other models immediately
  Transaction.belongsTo(sequelize.models.User, { foreignKey: 'operator_id', as: 'Operator' });
  Transaction.belongsTo(sequelize.models.Nozzle, { foreignKey: 'nozzle_id' });
  Transaction.belongsTo(sequelize.models.PaymentMethod, { foreignKey: 'payment_method_id' });
  if (sequelize.models.CreditCustomer) {
    Transaction.belongsTo(sequelize.models.CreditCustomer, { foreignKey: 'credit_customer_id' });
  }
  if (sequelize.models.OperatorGroup) {
    Transaction.belongsTo(sequelize.models.OperatorGroup, { foreignKey: 'operator_group_id', as: 'OperatorGroup' });
  }
  // Note: Booth info accessible via Transaction.Nozzle.Booth relationship
  // Note: POS transactions are independent of shift management

  return { Transaction, PaymentMethod };
};