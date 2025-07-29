import { Router } from 'express';
import AuthController from '../controller/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/login', AuthController.login);
router.post('/super-admin/login', AuthController.superAdminLogin);
router.get('/me', authenticate, AuthController.getCurrentUser);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;