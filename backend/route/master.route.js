import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import MasterController from '../controller/master.controller.js';

const router = express.Router();

router.post('/clients/register', authenticate, authorizeRoles('super_admin'), MasterController.registerClient);

export default router;