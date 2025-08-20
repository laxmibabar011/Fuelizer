import { Router } from 'express';
import OperationsController from '../controller/operations.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use( authenticate, tenantDbMiddleware );

// ===== SHIFT MANAGEMENT ROUTES =====
router.post('/shifts/start', OperationsController.startManagerShift);
router.post('/shifts/end', OperationsController.endManagerShift);

// ===== METER READINGS ROUTES =====
router.get('/meter-readings/:shiftLedgerId', OperationsController.getMeterReadings);
router.put('/meter-readings/:readingId', OperationsController.updateMeterReading);

// ===== DAILY OPERATIONS ROUTES =====
router.get('/operational-day/current', OperationsController.getCurrentOperationalDay);
router.get('/daily-summary/:date', OperationsController.getDailySummary);

// ===== SHIFT STATUS ROUTES =====
router.get('/shifts/current', OperationsController.getUserCurrentShift);
router.post('/shifts/check-in', OperationsController.checkInShift);
router.post('/shifts/check-out', OperationsController.checkOutShift);

export default router;
