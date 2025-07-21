import { Router } from 'express';
import { login, getCurrentUser, refresh, logout, forgotPassword, resetPassword } from '../controller/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.post('/refresh', refresh);
router.post('/logout', logout);
// Forgot password endpoints
router.post('/forgot-password', forgotPassword); // Request OTP
router.post('/reset-password', resetPassword);   // Verify OTP and reset password
export default router;