import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import CreditController from '../controller/credit.controller.js';

const router = Router();

// POST /tenant/credit/onboard - Only accessible by 'fuel-admin' users
router.post('/credit/onboard', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.onboardPartner);

// List all credit partners
router.get('/credit/partners', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.listCreditPartners);

// Get credit partner by ID
router.get('/credit/partners/:id', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.getCreditPartnerById);

// Update credit partner status
router.patch('/credit/partners/:id/status', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.updatePartnerStatus);

// Update credit limit for a partner
router.patch('/credit/partners/:id/credit-limit', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.updateCreditLimit);

// List vehicles for a partner
router.get('/credit/partners/:partnerId/vehicles', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.getVehiclesByPartnerId);

// Add vehicles for a partner (bulk)
router.post('/credit/partners/:partnerId/vehicles', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.addVehicles);

// Update a vehicle
router.put('/credit/vehicles/:vehicleId', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.updateVehicle);

// Set vehicle status
router.patch('/credit/vehicles/:vehicleId/status', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.setVehicleStatus);

// Delete a vehicle
router.delete('/credit/vehicles/:vehicleId', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.deleteVehicle);

// Search credit customers (used by POS and Sales UI)
router.get('/credit/customers', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin', 'operator'), CreditController.getCreditCustomers);

// Fetch user details by user_id (restricted to fuel-admin)
router.get('/userdetails/:userId', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.getUserDetails);

// Fetch user details by email (restricted to fuel-admin)
router.get('/userdetails/by-email/:email', authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'), CreditController.getUserDetailsByEmail);

export default router;