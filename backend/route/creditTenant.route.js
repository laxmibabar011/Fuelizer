import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  onboardPartner,
  listCreditPartners,
  getCreditPartnerById,
  updatePartnerStatus,
  getVehiclesByPartnerId,
  addVehicles,
  updateVehicle,
  setVehicleStatus,
  deleteVehicle
} from '../controller/credit.controller.js';
import { authorizeRoles } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../constants.js';

const router = Router();

// POST /tenant/credit/onboard - Only accessible by 'fuel-admin' users
router.post('/tenant/credit/onboard', authenticate, authorizeRoles('fuel-admin'), onboardPartner);

// List all credit partners
router.get(
  '/tenant/credit/partners',
  authenticate,
  authorizeRoles(USER_ROLES.FUEL_ADMIN),
  listCreditPartners
);

// Get credit partner by ID
router.get(
  '/tenant/credit/partners/:id',
  authenticate,
  authorizeRoles(USER_ROLES.FUEL_ADMIN),
  getCreditPartnerById
);

// Update credit partner status
router.patch(
  '/tenant/credit/partners/:id/status',
  authenticate,
  authorizeRoles(USER_ROLES.FUEL_ADMIN),
  updatePartnerStatus
);

// List vehicles for a partner
router.get(
  '/tenant/credit/partners/:partnerId/vehicles',
  authenticate,
  authorizeRoles(USER_ROLES.FUEL_ADMIN),
  getVehiclesByPartnerId
);

// Add vehicles for a partner (bulk)
router.post(
  '/tenant/credit/partners/:partnerId/vehicles',
  authenticate,
  authorizeRoles(USER_ROLES.FUEL_ADMIN),
  addVehicles
);

// Update a vehicle
router.put(
  '/tenant/credit/vehicles/:vehicleId',
  authenticate,
  authorizeRoles(USER_ROLES.FUEL_ADMIN),
  updateVehicle
);

// Set vehicle status
router.patch(
  '/tenant/credit/vehicles/:vehicleId/status',
  authenticate,
  authorizeRoles(USER_ROLES.FUEL_ADMIN),
  setVehicleStatus
);

// Delete a vehicle
router.delete(
  '/tenant/credit/vehicles/:vehicleId',
  authenticate,
  authorizeRoles(USER_ROLES.FUEL_ADMIN),
  deleteVehicle
);

export default router;