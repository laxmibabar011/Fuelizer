import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import StationController from '../controller/station.controller.js';

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticate, tenantDbMiddleware);

// Booths - Read access for operators (POS system), write access for fuel-admin
router.get('/station/booths', authorizeRoles('fuel-admin', 'operator'), StationController.listBooths);
router.post('/station/booths', authorizeRoles('fuel-admin'), StationController.createBooth);
router.put('/station/booths/:id', authorizeRoles('fuel-admin'), StationController.updateBooth);
router.delete('/station/booths/:id', authorizeRoles('fuel-admin'), StationController.deleteBooth);

// Nozzles - Read access for operators (POS system), write access for fuel-admin
router.get('/station/nozzles', authorizeRoles('fuel-admin', 'operator'), StationController.listNozzles);
router.post('/station/nozzles', authorizeRoles('fuel-admin'), StationController.createNozzle);
router.put('/station/nozzles/:id', authorizeRoles('fuel-admin'), StationController.updateNozzle);
router.delete('/station/nozzles/:id', authorizeRoles('fuel-admin'), StationController.deleteNozzle);

export default router;


