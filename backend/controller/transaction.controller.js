import { sendResponse } from '../util/response.util.js';
import DateUtil from '../util/date.util.js';
import { TransactionRepository } from '../repository/transaction.repository.js';

export default class TransactionController {
  // ===== PAYMENT METHOD CRUD =====
  static async createPaymentMethod(req, res) {
    try {
      const { name, bill_mode, party_name_strategy, default_party_name, party_name_uppercase } = req.body;

      if (!name) {
        return sendResponse(res, { 
          success: false, 
          error: 'Payment method name is required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      if (bill_mode && !['cash', 'credit', 'card', 'cash_party'].includes(bill_mode)) {
        return sendResponse(res, { 
          success: false, 
          error: 'Bill mode must be one of: cash, credit, card, cash_party', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const paymentMethod = await transactionRepo.createPaymentMethod({ 
        name, 
        bill_mode: bill_mode || 'card',
        party_name_strategy: party_name_strategy || 'fixed',
        default_party_name: default_party_name || null,
        party_name_uppercase: party_name_uppercase !== false
      });

      return sendResponse(res, { 
        data: paymentMethod, 
        message: 'Payment method created successfully', 
        status: 201 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create payment method', 
        status: 500 
      });
    }
  }

  static async getAllPaymentMethods(req, res) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const paymentMethods = await transactionRepo.getAllPaymentMethods(includeInactive);

      return sendResponse(res, { 
        data: paymentMethods, 
        message: 'Payment methods fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch payment methods', 
        status: 500 
      });
    }
  }

  static async getPaymentMethodById(req, res) {
    try {
      const { id } = req.params;
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const paymentMethod = await transactionRepo.getPaymentMethodById(id);

      if (!paymentMethod) {
        return sendResponse(res, { 
          success: false, 
          error: 'Payment method not found', 
          message: 'Not found', 
          status: 404 
        });
      }

      return sendResponse(res, { 
        data: paymentMethod, 
        message: 'Payment method fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch payment method', 
        status: 500 
      });
    }
  }

  static async updatePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Validate bill_mode if provided
      if (updateData.bill_mode && !['cash', 'credit', 'card', 'cash_party'].includes(updateData.bill_mode)) {
        return sendResponse(res, { 
          success: false, 
          error: 'Bill mode must be one of: cash, credit, card, cash_party', 
          message: 'Validation error', 
          status: 400 
        });
      }
      
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const result = await transactionRepo.updatePaymentMethod(id, updateData);

      return sendResponse(res, { 
        data: result, 
        message: 'Payment method updated successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to update payment method', 
        status: 500 
      });
    }
  }

  static async deletePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const transactionRepo = new TransactionRepository(req.tenantSequelize);

      const result = await transactionRepo.deletePaymentMethod(id);

      return sendResponse(res, { 
        data: result, 
        message: 'Payment method deleted successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to delete payment method', 
        status: 500 
      });
    }
  }

  // ===== TRANSACTION OPERATIONS =====
  static async createTransaction(req, res) {
    try {
      const transactionData = req.body;
      const userId = req.user.user_id;

      // Validate required fields
      const requiredFields = ['nozzleId', 'litresSold', 'pricePerLitre', 'paymentMethodId'];
      for (const field of requiredFields) {
        if (!transactionData[field]) {
          return sendResponse(res, { 
            success: false, 
            error: `${field} is required`, 
            message: 'Validation error', 
            status: 400 
          });
        }
      }

      const transactionRepo = new TransactionRepository(req.tenantSequelize);

      // Calculate total amount
      const totalAmount = parseFloat(transactionData.litresSold) * parseFloat(transactionData.pricePerLitre);

      const transaction = await transactionRepo.createTransaction({
        ...transactionData,
        operator_id: userId,
        total_amount: totalAmount,
        transaction_time: DateUtil.nowDate()
      });

      return sendResponse(res, { 
        data: transaction, 
        message: 'Transaction created successfully', 
        status: 201 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create transaction', 
        status: 500 
      });
    }
  }

  static async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const transaction = await transactionRepo.getTransactionById(id);

      if (!transaction) {
        return sendResponse(res, { 
          success: false, 
          error: 'Transaction not found', 
          message: 'Not found', 
          status: 404 
        });
      }

      return sendResponse(res, { 
        data: transaction, 
        message: 'Transaction fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch transaction', 
        status: 500 
      });
    }
  }

  static async getTransactionsByShift(req, res) {
    try {
      const { shiftLedgerId } = req.params;
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const transactions = await transactionRepo.getTransactionsByShiftLedger(shiftLedgerId);

      return sendResponse(res, { 
        data: transactions, 
        message: 'Transactions fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch transactions', 
        status: 500 
      });
    }
  }

  static async getTransactionsByOperator(req, res) {
    try {
      const { operatorId } = req.params;
      const { startDate, endDate } = req.query;
      
      console.log("=== GET TRANSACTIONS BY OPERATOR DEBUG ===");
      console.log("operatorId from params:", operatorId);
      console.log("startDate:", startDate);
      console.log("endDate:", endDate);
      
      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null;
      console.log("dateRange:", dateRange);
      
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const transactions = await transactionRepo.getTransactionsByOperator(operatorId, dateRange);

      console.log("Transactions found:", transactions.length);
      console.log("First transaction:", transactions[0]);

      return sendResponse(res, { 
        data: transactions, 
        message: 'Transactions fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch transactions', 
        status: 500 
      });
    }
  }

  static async getTransactionsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return sendResponse(res, { 
          success: false, 
          error: 'Start date and end date are required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const transactions = await transactionRepo.getTransactionsByDateRange(startDate, endDate);

      return sendResponse(res, { 
        data: transactions, 
        message: 'Transactions fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch transactions', 
        status: 500 
      });
    }
  }

  static async getTransactionsByOperatorGroup(req, res) {
    try {
      const { operatorGroupId } = req.params;
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const transactions = await transactionRepo.getTransactionsByOperatorGroup(operatorGroupId);

      return sendResponse(res, { 
        data: transactions, 
        message: 'Operator group transactions fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch operator group transactions', 
        status: 500 
      });
    }
  }

  static async getAllTransactions(req, res) {
    try {
      const { limit = 50 } = req.query;
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      
      // Get all transactions with a reasonable limit, ordered by most recent
      const transactions = await transactionRepo.getAllTransactions(parseInt(limit));

      return sendResponse(res, { 
        data: transactions, 
        message: 'All transactions fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch all transactions', 
        status: 500 
      });
    }
  }

  // ===== CASHIER OPERATIONS =====
  static async recordTransactionByCashier(req, res) {
    try {
      const transactionData = req.body;
      const jwtUserId = req.user.user_id;
      
      // Debug: User resolution
      console.log(`Resolving user: ${jwtUserId || 'undefined'} -> ${req.user?.email}`);

      // Resolve tenant user ID (same pattern as in operations controller)
      const { User } = req.tenantSequelize.models;
      let user = await User.findByPk(jwtUserId);
      if (!user && req.user?.email) {
        user = await User.findOne({ where: { email: req.user.email } });
      }

      if (!user) {
        return sendResponse(res, { 
          success: false, 
          error: 'User not found', 
          message: 'Cannot process transaction', 
          status: 404 
        });
      }

      const cashierId = user.user_id;
      console.log(`Resolved cashierId: ${cashierId}`);

      // Validate required fields
      const requiredFields = ['operatorId', 'nozzleId', 'litresSold', 'pricePerLitre', 'paymentMethodId'];
      for (const field of requiredFields) {
        if (!transactionData[field]) {
          return sendResponse(res, { 
            success: false, 
            error: `${field} is required`, 
            message: 'Validation error', 
            status: 400 
          });
        }
      }

      const transactionRepo = new TransactionRepository(req.tenantSequelize);

      // Calculate total amount
      const totalAmount = parseFloat(transactionData.litresSold) * parseFloat(transactionData.pricePerLitre);

      // Repository handles all validation (cashier authorization, nozzle access, etc.)
      const transaction = await transactionRepo.recordTransactionByCashier(cashierId, {
        ...transactionData,
        total_amount: totalAmount,
        transaction_time: DateUtil.nowDate()
      });

      return sendResponse(res, { 
        data: transaction, 
        message: 'Transaction recorded successfully', 
        status: 201 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to record transaction', 
        status: 500 
      });
    }
  }

  // ===== ANALYTICS =====
  static async getShiftSummary(req, res) {
    try {
      const { shiftLedgerId } = req.params;
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const summary = await transactionRepo.getShiftSummary(shiftLedgerId);

      return sendResponse(res, { 
        data: summary, 
        message: 'Shift summary fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch shift summary', 
        status: 500 
      });
    }
  }

  static async getDailyTransactionSummary(req, res) {
    try {
      const { date } = req.params;
      const transactionRepo = new TransactionRepository(req.tenantSequelize);
      const summary = await transactionRepo.getDailySummary(date);

      return sendResponse(res, { 
        data: summary, 
        message: 'Daily transaction summary fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch daily transaction summary', 
        status: 500 
      });
    }
  }
}
