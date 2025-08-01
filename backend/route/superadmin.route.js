import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import SuperAdminController from '../controller/superadmin.controller.js';

const router = Router();

// All routes require super_admin role
router.use(authenticate, authorizeRoles('super_admin'));

router.get('/clients', SuperAdminController.listClients);
router.get('/clients/:id', SuperAdminController.getClient);
router.get('/users', SuperAdminController.listUsers);
router.get('/users/:id', SuperAdminController.getUser);

export default router;