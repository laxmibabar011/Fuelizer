import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { onboardPartner, listCreditPartners, getCreditPartnerById, updatePartnerStatus } from '../controller/credit.controller.js';
import { authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// POST /tenant/credit/onboard - Only accessible by 'fuel-admin' users
router.post('/tenant/credit/onboard', authenticate, authorizeRoles('fuel-admin'), onboardPartner);

// List all credit partners
router.get(
  '/tenant/credit/partners',
  authenticate,
  authorizeRoles('fuel-admin'),
  listCreditPartners
);

// Get credit partner by ID
router.get(
  '/tenant/credit/partners/:id',
  authenticate,
  authorizeRoles('fuel-admin'),
  getCreditPartnerById
);

// Update credit partner status
router.patch(
  '/tenant/credit/partners/:id/status',
  authenticate,
  authorizeRoles('fuel-admin'),
  updatePartnerStatus
);

export default router;