import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import { onboardPartner, listCreditPartners, getCreditPartnerById, updatePartnerStatus } from '../controller/credit.controller.js';
import { authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();


router.use(authenticate, tenantDbMiddleware , authorizeRoles('fuel-admin'));

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
router.post('/tenant/credit/onboard',onboardPartner);

// List all credit partners
router.get(
  '/tenant/credit/partners',
  authenticate,
  authorizeRoles('fuel-admin'),
  tenantDbMiddleware,
  listCreditPartners
);
// Get credit partner by ID
router.get(
  '/tenant/credit/partners/:id',
  authenticate,
  authorizeRoles('fuel-admin'),
  tenantDbMiddleware,
  getCreditPartnerById
);

// Update credit partner status
router.patch(
  '/tenant/credit/partners/:id/status',
  authenticate,
  authorizeRoles('fuel-admin'),
  tenantDbMiddleware,
  updatePartnerStatus
);

export default router;