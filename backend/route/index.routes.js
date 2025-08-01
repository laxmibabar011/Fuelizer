import { Router } from 'express';
import authRoutes from './auth.route.js';
import masterRoutes from './master.route.js';
import creditTenantRoutes from './creditTenant.route.js';
import superadminRoutes from './superadmin.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/master', masterRoutes);
router.use('/tenant', creditTenantRoutes);
router.use('/superadmin', superadminRoutes);

export default router;