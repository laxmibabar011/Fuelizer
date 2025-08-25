import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import StaffShiftController from '../controller/staffshift.controller.js';
import GroupBoothController from '../controller/groupBooth.controller.js';

const router = Router();

// All endpoints restricted to fuel-admin (tenant scope)
router.use(authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'));

// ===== OPERATOR ROUTES =====
router.post('/staffshift/admins/onboard', StaffShiftController.onboardAdmin);
router.get('/staffshift/admins', StaffShiftController.listAdmins);
router.get('/staffshift/manager-shifts/available', StaffShiftController.listAvailableManagerShifts);
router.post('/staffshift/manager-shifts/assign', StaffShiftController.assignManagerShift);
router.post('/staffshift/manager-shifts/unassign', StaffShiftController.unassignManagerShift);
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

// ===== NEW: Get operators by shift =====
router.get('/staffshift/shifts/:shiftId/operators', StaffShiftController.getOperatorsByShift);

// ===== OPERATOR GROUP ROUTES =====
router.post('/staffshift/operator-groups', StaffShiftController.createOperatorGroup);
router.get('/staffshift/operator-groups', StaffShiftController.getAllOperatorGroups);
router.get('/staffshift/operator-groups/:id', StaffShiftController.getOperatorGroupById);
router.put('/staffshift/operator-groups/:id', StaffShiftController.updateOperatorGroup);
router.delete('/staffshift/operator-groups/:id', StaffShiftController.deleteOperatorGroup);

// New: Operator Group Attendants
router.post('/staffshift/operator-groups/:groupId/attendants', StaffShiftController.setGroupAttendants);
router.get('/staffshift/operator-groups/:groupId/attendants', StaffShiftController.getGroupAttendants);

// ===== GROUP ↔ BOOTH MAPPING =====
router.post('/staffshift/operator-groups/:groupId/booths', GroupBoothController.mapGroupToBooths);
router.get('/staffshift/operator-groups/:groupId/booths', GroupBoothController.getGroupBooths);
router.delete('/staffshift/operator-groups/:groupId/booths/:boothId', GroupBoothController.unmapGroupFromBooth);
router.get('/staffshift/booth-assignments', GroupBoothController.listBoothAssignmentsByShift);

export default router; 