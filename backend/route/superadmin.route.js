import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { listClients, getClient, listUsers, getUser } from '../controller/superadmin.controller.js';

const router = Router();

// All routes require super_admin role
router.use(authenticate, authorizeRoles('super_admin'));

router.get('/superadmin/clients', listClients);
router.get('/superadmin/clients/:id', getClient);
router.get('/superadmin/users', listUsers);
router.get('/superadmin/users/:id', getUser);

export default router;