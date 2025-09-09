import { Op } from 'sequelize';

export class TransactionRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.Transaction = sequelize.models.Transaction;
    this.PaymentMethod = sequelize.models.PaymentMethod;
    this.User = sequelize.models.User;
    this.ShiftLedger = sequelize.models.ShiftLedger;
    this.Nozzle = sequelize.models.Nozzle;
    this.CreditCustomer = sequelize.models.CreditCustomer;
  }

  // ===== PAYMENT METHOD METHODS =====
  async createPaymentMethod(paymentMethodData) {
    return await this.PaymentMethod.create(paymentMethodData);
  }

  async getAllPaymentMethods(includeInactive = false) {
    const where = includeInactive ? {} : { is_active: true };
    return await this.PaymentMethod.findAll({
      where,
      order: [['name', 'ASC']]
    });
  }

  async getPaymentMethodById(id) {
    return await this.PaymentMethod.findByPk(id);
  }

  async updatePaymentMethod(id, updateData) {
    return await this.PaymentMethod.update(updateData, {
      where: { id }
    });
  }

  async deletePaymentMethod(id) {
    return await this.PaymentMethod.update(
      { is_active: false },
      { where: { id } }
    );
  }

  // ===== TRANSACTION METHODS =====
  async createTransaction(transactionData) {
    return await this.Transaction.create(transactionData);
  }

  async getTransactionById(id) {
    return await this.Transaction.findByPk(id, {
      include: [
        { model: this.ShiftLedger },
        { model: this.User, as: 'Operator' },
        { model: this.Nozzle },
        { model: this.PaymentMethod },
        { model: this.CreditCustomer }
      ]
    });
  }

  async getTransactionsByShiftLedger(shiftLedgerId) {
    return await this.Transaction.findAll({
      where: { shift_ledger_id: shiftLedgerId },
      include: [
        { model: this.User, as: 'Operator' },
        { model: this.Nozzle },
        { model: this.PaymentMethod },
        { model: this.CreditCustomer }
      ],
      order: [['transaction_time', 'ASC']]
    });
  }

  async getTransactionsByOperator(operatorId, dateRange = null) {
    const where = { operator_id: operatorId };
    
    if (dateRange) {
      where.transaction_time = {
        [Op.between]: [dateRange.start, dateRange.end]
      };
    }

    return await this.Transaction.findAll({
      where,
      include: [
        { model: this.ShiftLedger },
        { model: this.Nozzle },
        { model: this.PaymentMethod },
        { model: this.CreditCustomer }
      ],
      order: [['transaction_time', 'DESC']]
    });
  }

  async getTransactionsByDateRange(startDate, endDate) {
    return await this.Transaction.findAll({
      where: {
        transaction_time: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        { model: this.ShiftLedger },
        { model: this.User, as: 'Operator' },
        { model: this.Nozzle },
        { model: this.PaymentMethod },
        { model: this.CreditCustomer }
      ],
      order: [['transaction_time', 'DESC']]
    });
  }

  // ===== ANALYTICS METHODS =====
  async getShiftSummary(shiftLedgerId) {
    const transactions = await this.getTransactionsByShiftLedger(shiftLedgerId);
    
    const summary = {
      totalTransactions: transactions.length,
      totalLitres: 0,
      totalAmount: 0,
      byPaymentMethod: {},
      byNozzle: {},
      byOperator: {}
    };

    transactions.forEach(transaction => {
      // Total calculations
      summary.totalLitres += parseFloat(transaction.litres_sold);
      summary.totalAmount += parseFloat(transaction.total_amount);

      // By payment method
      const paymentMethod = transaction.PaymentMethod?.name || 'Unknown';
      if (!summary.byPaymentMethod[paymentMethod]) {
        summary.byPaymentMethod[paymentMethod] = { count: 0, amount: 0 };
      }
      summary.byPaymentMethod[paymentMethod].count++;
      summary.byPaymentMethod[paymentMethod].amount += parseFloat(transaction.total_amount);

      // By nozzle
      const nozzleCode = transaction.Nozzle?.code || 'Unknown';
      if (!summary.byNozzle[nozzleCode]) {
        summary.byNozzle[nozzleCode] = { litres: 0, amount: 0 };
      }
      summary.byNozzle[nozzleCode].litres += parseFloat(transaction.litres_sold);
      summary.byNozzle[nozzleCode].amount += parseFloat(transaction.total_amount);

      // By operator
      const operatorName = transaction.Operator?.UserDetails?.full_name || 'Unknown';
      if (!summary.byOperator[operatorName]) {
        summary.byOperator[operatorName] = { count: 0, amount: 0 };
      }
      summary.byOperator[operatorName].count++;
      summary.byOperator[operatorName].amount += parseFloat(transaction.total_amount);
    });

    return summary;
  }

  async getDailySummary(businessDate) {
    const startOfDay = new Date(businessDate);
    const endOfDay = new Date(businessDate);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.getTransactionsByDateRange(startOfDay, endOfDay);
    
    const summary = {
      date: businessDate,
      totalTransactions: transactions.length,
      totalLitres: 0,
      totalAmount: 0,
      byPaymentMethod: {},
      byNozzle: {},
      byOperator: {},
      byShift: {}
    };

    transactions.forEach(transaction => {
      // Total calculations
      summary.totalLitres += parseFloat(transaction.litres_sold);
      summary.totalAmount += parseFloat(transaction.total_amount);

      // By payment method
      const paymentMethod = transaction.PaymentMethod?.name || 'Unknown';
      if (!summary.byPaymentMethod[paymentMethod]) {
        summary.byPaymentMethod[paymentMethod] = { count: 0, amount: 0 };
      }
      summary.byPaymentMethod[paymentMethod].count++;
      summary.byPaymentMethod[paymentMethod].amount += parseFloat(transaction.total_amount);

      // By nozzle
      const nozzleCode = transaction.Nozzle?.code || 'Unknown';
      if (!summary.byNozzle[nozzleCode]) {
        summary.byNozzle[nozzleCode] = { litres: 0, amount: 0 };
      }
      summary.byNozzle[nozzleCode].litres += parseFloat(transaction.litres_sold);
      summary.byNozzle[nozzleCode].amount += parseFloat(transaction.total_amount);

      // By operator
      const operatorName = transaction.Operator?.UserDetails?.full_name || 'Unknown';
      if (!summary.byOperator[operatorName]) {
        summary.byOperator[operatorName] = { count: 0, amount: 0 };
      }
      summary.byOperator[operatorName].count++;
      summary.byOperator[operatorName].amount += parseFloat(transaction.total_amount);

      // By shift
      const shiftName = transaction.ShiftLedger?.Shift?.name || 'Unknown';
      if (!summary.byShift[shiftName]) {
        summary.byShift[shiftName] = { count: 0, amount: 0 };
      }
      summary.byShift[shiftName].count++;
      summary.byShift[shiftName].amount += parseFloat(transaction.total_amount);
    });

    return summary;
  }

  // ===== CASHIER OPERATIONS =====
  async recordTransactionByCashier(cashierId, transactionData) {
    return await this.sequelize.transaction(async (t) => {
      // Verify cashier has active shift
      const activeShift = await this.ShiftLedger.findOne({
        where: {
          fuel_admin_id: cashierId,
          status: 'ACTIVE'
        }
      }, { transaction: t });

      if (!activeShift) {
        throw new Error('No active shift found for cashier');
      }

      // Create transaction
      const transaction = await this.createTransaction({
        ...transactionData,
        shift_ledger_id: activeShift.id
      }, { transaction: t });

      return transaction;
    });
  }
}
