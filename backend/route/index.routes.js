import { Router } from 'express';
import authRoutes from './auth.route.js';
import masterRoutes from './master.route.js';
import tenantRoutes from './tenant.route.js';
import superadminRoutes from './superadmin.route.js';
import creditRoutes from './credit.route.js';

const router = Router();

router.use('/', authRoutes);
router.use('/', masterRoutes);
router.use('/', tenantRoutes);
router.use('/', superadminRoutes);

export default router;