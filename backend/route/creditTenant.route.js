import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import CreditController from '../controller/credit.controller.js';

const router = Router();

// POST /tenant/credit/onboard - Only accessible by 'fuel-admin' users
router.post('/tenant/credit/onboard', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.onboardPartner);

// List all credit partners
router.get('/tenant/credit/partners', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.listCreditPartners);

// Get credit partner by ID
router.get('/tenant/credit/partners/:id', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.getCreditPartnerById);

// Update credit partner status
router.patch('/tenant/credit/partners/:id/status', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.updatePartnerStatus);

// List vehicles for a partner
router.get('/tenant/credit/partners/:partnerId/vehicles', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.getVehiclesByPartnerId);

// Add vehicles for a partner (bulk)
router.post('/tenant/credit/partners/:partnerId/vehicles', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.addVehicles);

// Update a vehicle
router.put('/tenant/credit/vehicles/:vehicleId', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.updateVehicle);

// Set vehicle status
router.patch('/tenant/credit/vehicles/:vehicleId/status', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.setVehicleStatus);

// Delete a vehicle
router.delete('/tenant/credit/vehicles/:vehicleId', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.deleteVehicle);

// Fetch user details by user_id (restricted to fuel-admin)
router.get('/tenant/userdetails/:userId', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.getUserDetails);

// Fetch user details by email (restricted to fuel-admin)
router.get('/tenant/userdetails/by-email/:email', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.getUserDetailsByEmail);

export default router;