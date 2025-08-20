import { Router } from 'express';
import authRoutes from './auth.route.js';
import masterRoutes from './master.route.js';
import creditTenantRoutes from './creditTenant.route.js';
import superadminRoutes from './superadmin.route.js';
import stationRoutes from './station.route.js';
import productMasterRoutes from './productMaster.route.js';
import staffshiftRoutes from './staffshift.route.js';
import operationsRoutes from './operations.route.js';
import transactionRoutes from './transaction.route.js';
const router = Router();

router.use('/auth', authRoutes);
router.use('/master', masterRoutes);
router.use('/tenant', creditTenantRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/tenant', stationRoutes);
router.use('/tenant', productMasterRoutes);
router.use('/tenant', staffshiftRoutes);
router.use('/tenant', operationsRoutes);
router.use('/tenant', transactionRoutes);

export default router;