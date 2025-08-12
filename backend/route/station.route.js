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

// Nozzles
router.get('/station/booths/:boothId/nozzles', StationController.listNozzles);
router.post('/station/booths/:boothId/nozzles', StationController.upsertNozzle);
router.put('/station/nozzles/:nozzleId', StationController.upsertNozzle);
router.delete('/station/nozzles/:nozzleId', StationController.deleteNozzle);

export default router;


