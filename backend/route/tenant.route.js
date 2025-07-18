import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import { onboardPartner } from '../controller/credit.controller.js';
import { authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Example: Get all users in the tenant DB (fuel-admin only)
router.get('/tenant/users', authenticate, tenantDbMiddleware, async (req, res) => {
  try {
    const { User } = req.tenantModels;
    const users = await User.findAll();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /tenant/credit/onboard - Only accessible by 'fuel-admin' users
router.post(
  '/tenant/credit/onboard',
  authenticate,
  authorizeRoles('fuel-admin'),
  tenantDbMiddleware,
  onboardPartner
);

export default router;