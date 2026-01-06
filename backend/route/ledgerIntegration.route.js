import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { tenantDbMiddleware } from "../middleware/tenant.middleware.js";
import LedgerIntegrationController from "../controller/ledgerIntegration.controller.js";

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticate, tenantDbMiddleware);

// All integration operations require fuel-admin role for financial data security
router.use(authorizeRoles("fuel-admin"));

// --- Integration Endpoints ---

// Purchase Integration
router.post(
  "/purchase/:purchaseId",
  LedgerIntegrationController.createPurchaseJournalEntries
);

// Sales Integration
router.post(
  "/sales",
  LedgerIntegrationController.createSalesJournalEntries
);

// Customer Payment Integration
router.post(
  "/customer-payment",
  LedgerIntegrationController.createCustomerPaymentJournalEntries
);

// Settings Management
router.get(
  "/settings",
  LedgerIntegrationController.getIntegrationSettings
);

router.put(
  "/settings",
  LedgerIntegrationController.updateIntegrationSettings
);

// Account Management
router.get(
  "/accounts",
  LedgerIntegrationController.getAvailableAccounts
);

// Testing
router.post(
  "/test",
  LedgerIntegrationController.testIntegration
);

export default router;
