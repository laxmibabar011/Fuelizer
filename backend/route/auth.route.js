import { Router } from 'express';
import { login, getCurrentUser, refresh, logout } from '../controller/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);

// Add /me endpoint
// router.get('/me', getCurrentUser);

router.get('/me', authenticate, getCurrentUser);

// Add /refresh endpoint
router.post('/refresh', refresh);

// Add /logout endpoint
router.post('/logout', logout);

export default router;