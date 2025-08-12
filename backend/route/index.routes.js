import { Router } from 'express';
import authRoutes from './auth.route.js';
import masterRoutes from './master.route.js';
import creditTenantRoutes from './creditTenant.route.js';
import superadminRoutes from './superadmin.route.js';
import stationRoutes from './station.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/master', masterRoutes);
router.use('/tenant', creditTenantRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/tenant', stationRoutes);

export default router;