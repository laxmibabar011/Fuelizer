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
        { model: this.User, as: 'Operator' },
        { model: this.Nozzle },
        { model: this.PaymentMethod }
      ]
    });
  }

  async getTransactionsByOperatorGroup(operatorGroupId) {
    return await this.Transaction.findAll({
      where: { operator_group_id: operatorGroupId },
      include: [
        { model: this.User, as: 'Operator' },
        { model: this.Nozzle },
        { model: this.PaymentMethod }
      ],
      order: [['transaction_time', 'DESC']]
    });
  }

  async getAllTransactions(limit = 50) {
    return await this.Transaction.findAll({
      include: [
        { model: this.User, as: 'Operator' },
        { 
          model: this.Nozzle,
          include: [
            { model: this.sequelize.models.Product, as: 'Product' }
          ]
        },
        { model: this.PaymentMethod }
      ],
      order: [['transaction_time', 'DESC']],
      limit: limit
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
        { model: this.Nozzle },
        { model: this.PaymentMethod }
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
        { model: this.User, as: 'Operator' },
        { model: this.Nozzle },
        { model: this.PaymentMethod }
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
    const { StaffShiftRepository } = await import('./staffshift.repository.js');
    
    return await this.sequelize.transaction(async (t) => {
      // 1. Get cashier's POS context with full validation
      const staffRepo = new StaffShiftRepository(this.sequelize);
      const cashierContext = await staffRepo.getCashierPOSContext(cashierId);
      
      if (!cashierContext) {
        throw new Error('Cashier not assigned to any operator group');
      }

      // 2. Validate nozzle belongs to cashier's assigned booths
      const assignedBoothIds = cashierContext.assignedBooths.map(booth => booth.id);
      const nozzle = await this.Nozzle.findByPk(transactionData.nozzleId || transactionData.nozzle_id, {
        transaction: t
      });
      
      if (!nozzle) {
        throw new Error('Nozzle not found');
      }

      if (!assignedBoothIds.includes(nozzle.boothId)) {
        throw new Error('Nozzle not assigned to cashier\'s booth');
      }

      // 3. Validate operator belongs to cashier's team
      const operatorId = transactionData.operatorId || transactionData.operator_id;
      const teamMemberIds = cashierContext.teamMembers.map(member => member.id);
      
      // Debug: Operator validation
      console.log(`Validating operator '${operatorId}' for cashier '${cashierId}' with team: [${teamMemberIds.join(', ')}]`);
      
      if (operatorId !== cashierId && !teamMemberIds.includes(operatorId)) {
        throw new Error(`Operator '${operatorId}' not authorized for cashier '${cashierId}'. Team: [${teamMemberIds.join(', ')}]`);
      }

      // 4. POS transactions are independent - no shift ledger requirement
      console.log('POS transaction processing - fully independent mode');

      // 5. Create transaction with full context
      // Amount-mode: if amount is provided, store it EXACTLY; compute litres from amount/price
      // Litres-mode: if litres is provided, compute total = litres * price
      const priceRaw = transactionData.pricePerLitre || transactionData.price_per_litre_at_sale;
      const amountRaw = (transactionData.amount !== undefined ? transactionData.amount : transactionData.total_amount);
      const litresRaw = transactionData.litresSold || transactionData.litres_sold;

      const priceNum = Number(priceRaw);
      let litresNum = litresRaw != null ? Number(litresRaw) : undefined;
      let totalNum = amountRaw != null ? Number(amountRaw) : undefined;

      if (totalNum != null && !Number.isNaN(totalNum)) {
        // Amount-mode: compute litres to 4 dp; keep total as-is to 4 dp
        const litresComputed = priceNum > 0 ? totalNum / priceNum : 0;
        litresNum = Number(litresComputed.toFixed(4));
        totalNum = Number(totalNum.toFixed(4));
      } else {
        // Litres-mode: compute total to 4 dp
        litresNum = Number((litresNum ?? 0).toFixed(4));
        totalNum = Number((litresNum * priceNum).toFixed(4));
      }

      const enhancedTransactionData = {
        ...transactionData,
        // Normalize field names
        nozzle_id: transactionData.nozzleId || transactionData.nozzle_id,
        operator_id: operatorId,
        litres_sold: litresNum,
        price_per_litre_at_sale: Number(priceNum.toFixed(4)),
        payment_method_id: transactionData.paymentMethodId || transactionData.payment_method_id,
        credit_customer_id: transactionData.creditCustomerId || transactionData.credit_customer_id,
        
        // Add context fields - POS independent mode
        operator_group_id: cashierContext.operatorGroup.id,
        // Note: Only store the actual operator who performed the transaction
        
        total_amount: totalNum,
      };

      const transaction = await this.createTransaction(enhancedTransactionData, { transaction: t });

      // 6. Return transaction with populated associations for response
      return await this.getTransactionById(transaction.id);
    });
  }
}

