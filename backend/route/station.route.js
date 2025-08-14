import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import StationController from '../controller/station.controller.js';

const router = Router();

// All endpoints restricted to fuel-admin (tenant scope)
router.use(authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'));

// Booths
router.get('/station/booths', StationController.listBooths);
router.post('/station/booths', StationController.createBooth);
router.put('/station/booths/:id', StationController.updateBooth);
router.delete('/station/booths/:id', StationController.deleteBooth);

// Nozzles (simple CRUD)
router.get('/station/nozzles', StationController.listNozzles);
router.post('/station/nozzles', StationController.createNozzle);
router.put('/station/nozzles/:id', StationController.updateNozzle);
router.delete('/station/nozzles/:id', StationController.deleteNozzle);

export default router;


