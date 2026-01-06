import { Router } from 'express';
import TransactionController from '../controller/transaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use( authenticate, tenantDbMiddleware );

// ===== PAYMENT METHOD ROUTES =====
router.post('/payment-methods', TransactionController.createPaymentMethod);
router.get('/payment-methods', TransactionController.getAllPaymentMethods);
router.get('/payment-methods/:id', TransactionController.getPaymentMethodById);
router.put('/payment-methods/:id', TransactionController.updatePaymentMethod);
router.delete('/payment-methods/:id', TransactionController.deletePaymentMethod);

// ===== TRANSACTION ROUTES =====
router.post('/transactions', TransactionController.createTransaction);
router.get('/transactions/date-range', TransactionController.getTransactionsByDateRange);
router.get('/transactions/shift/:shiftLedgerId', TransactionController.getTransactionsByShift);
router.get('/transactions/operator/:operatorId', TransactionController.getTransactionsByOperator);
router.get('/transactions/operator-group/:operatorGroupId', TransactionController.getTransactionsByOperatorGroup);
router.get('/transactions/all', TransactionController.getAllTransactions);
router.get('/transactions/:id', TransactionController.getTransactionById);

// ===== CASHIER OPERATIONS =====
router.post('/transactions/cashier', TransactionController.recordTransactionByCashier);

// ===== ANALYTICS ROUTES =====
router.get('/analytics/shift/:shiftLedgerId', TransactionController.getShiftSummary);
router.get('/analytics/daily/:date', TransactionController.getDailyTransactionSummary);

export default router;
