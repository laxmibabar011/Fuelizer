import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import StaffShiftController from '../controller/staffshift.controller.js';
import GroupBoothController from '../controller/groupBooth.controller.js';

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticate, tenantDbMiddleware);

// ===== OPERATOR ROUTES =====
router.post('/staffshift/admins/onboard', authorizeRoles('fuel-admin'), StaffShiftController.onboardAdmin);
router.get('/staffshift/admins', authorizeRoles('fuel-admin'), StaffShiftController.listAdmins);
router.get('/staffshift/manager-shifts/available', authorizeRoles('fuel-admin'), StaffShiftController.listAvailableManagerShifts);
router.post('/staffshift/manager-shifts/assign', authorizeRoles('fuel-admin'), StaffShiftController.assignManagerShift);
router.post('/staffshift/manager-shifts/unassign', authorizeRoles('fuel-admin'), StaffShiftController.unassignManagerShift);
router.post('/staffshift/operators/onboard', authorizeRoles('fuel-admin'), StaffShiftController.onboardOperator);
router.post('/staffshift/operators', authorizeRoles('fuel-admin'), StaffShiftController.createOperator);
router.get('/staffshift/operators', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getAllOperators);
router.get('/staffshift/operators/available', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getAvailableOperators);
router.get('/staffshift/operators/:id', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getOperatorById);
router.put('/staffshift/operators/:id', authorizeRoles('fuel-admin'), StaffShiftController.updateOperator);
router.delete('/staffshift/operators/:id', authorizeRoles('fuel-admin'), StaffShiftController.deleteOperator);

// ===== SHIFT ROUTES =====
router.post('/staffshift/shifts', authorizeRoles('fuel-admin'), StaffShiftController.createShift);
router.get('/staffshift/shifts', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getAllShifts);
router.get('/staffshift/shifts/:id', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getShiftById);
router.put('/staffshift/shifts/:id', authorizeRoles('fuel-admin'), StaffShiftController.updateShift);
router.delete('/staffshift/shifts/:id', authorizeRoles('fuel-admin'), StaffShiftController.deleteShift);

// ===== SHIFT ASSIGNMENT ROUTES =====
router.post('/staffshift/shift-assignments', authorizeRoles('fuel-admin'), StaffShiftController.createShiftAssignment);
router.get('/staffshift/shift-assignments', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getShiftAssignments);
router.put('/staffshift/shift-assignments/:id', authorizeRoles('fuel-admin'), StaffShiftController.updateShiftAssignment);
router.delete('/staffshift/shift-assignments/:id', authorizeRoles('fuel-admin'), StaffShiftController.deleteShiftAssignment);

// ===== NEW: Get operators by shift =====
router.get('/staffshift/shifts/:shiftId/operators', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getOperatorsByShift);

// ===== OPERATOR GROUP ROUTES =====
router.post('/staffshift/operator-groups', authorizeRoles('fuel-admin'), StaffShiftController.createOperatorGroup);
router.get('/staffshift/operator-groups', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getAllOperatorGroups);
router.get('/staffshift/operator-groups/:id', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getOperatorGroupById);
router.put('/staffshift/operator-groups/:id', authorizeRoles('fuel-admin'), StaffShiftController.updateOperatorGroup);
router.delete('/staffshift/operator-groups/:id', authorizeRoles('fuel-admin'), StaffShiftController.deleteOperatorGroup);

// New: Operator Group Attendants
router.post('/staffshift/operator-groups/:groupId/attendants', authorizeRoles('fuel-admin'), StaffShiftController.setGroupAttendants);
router.get('/staffshift/operator-groups/:groupId/attendants', authorizeRoles('fuel-admin', 'operator'), StaffShiftController.getGroupAttendants);

// ===== GROUP ↔ BOOTH MAPPING =====
router.post('/staffshift/operator-groups/:groupId/booths', authorizeRoles('fuel-admin'), GroupBoothController.mapGroupToBooths);
router.get('/staffshift/operator-groups/:groupId/booths', authorizeRoles('fuel-admin', 'operator'), GroupBoothController.getGroupBooths);
router.delete('/staffshift/operator-groups/:groupId/booths/:boothId', authorizeRoles('fuel-admin'), GroupBoothController.unmapGroupFromBooth);
router.get('/staffshift/booth-assignments', authorizeRoles('fuel-admin', 'operator'), GroupBoothController.listBoothAssignmentsByShift);

// ===== POS CONTEXT ROUTES =====
router.get('/staffshift/pos/context', authorizeRoles('operator'), StaffShiftController.getCashierPOSContext);
router.get('/staffshift/pos/validate-access', authorizeRoles('operator'), StaffShiftController.validatePOSAccess);

export default router; 