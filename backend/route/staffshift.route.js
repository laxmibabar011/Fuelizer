import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import StaffShiftController from '../controller/staffshift.controller.js';

const router = Router();

// All endpoints restricted to fuel-admin (tenant scope)
router.use(authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'));

// ===== OPERATOR ROUTES =====
router.post('/staffshift/operators/onboard', StaffShiftController.onboardOperator);
router.post('/staffshift/operators', StaffShiftController.createOperator);
router.get('/staffshift/operators', StaffShiftController.getAllOperators);
router.get('/staffshift/operators/available', StaffShiftController.getAvailableOperators);
router.get('/staffshift/operators/:id', StaffShiftController.getOperatorById);
router.put('/staffshift/operators/:id', StaffShiftController.updateOperator);
router.delete('/staffshift/operators/:id', StaffShiftController.deleteOperator);

// ===== SHIFT ROUTES =====
router.post('/staffshift/shifts', StaffShiftController.createShift);
router.get('/staffshift/shifts', StaffShiftController.getAllShifts);
router.get('/staffshift/shifts/:id', StaffShiftController.getShiftById);
router.put('/staffshift/shifts/:id', StaffShiftController.updateShift);
router.delete('/staffshift/shifts/:id', StaffShiftController.deleteShift);

// ===== SHIFT ASSIGNMENT ROUTES =====
router.post('/staffshift/shift-assignments', StaffShiftController.createShiftAssignment);
router.get('/staffshift/shift-assignments', StaffShiftController.getShiftAssignments);
router.put('/staffshift/shift-assignments/:id', StaffShiftController.updateShiftAssignment);
router.delete('/staffshift/shift-assignments/:id', StaffShiftController.deleteShiftAssignment);

export default router; 