import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { tenantDbMiddleware } from "../middleware/tenant.middleware.js";
import {
  validateVoucherCreation,
  validateAccountCreation,
  validateAccountUpdate,
  validateDateRange,
} from "../middleware/ledger.validation.js";
import LedgerController from "../controller/ledger.controller.js";
import ledgerIntegrationRoutes from "./ledgerIntegration.route.js";

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticate, tenantDbMiddleware);

// --- Chart of Accounts Management ---
// All ledger operations require fuel-admin role for financial data security
const accountRouter = Router();
accountRouter.post(
  "/",
  authorizeRoles("fuel-admin"),
  validateAccountCreation,
  LedgerController.createAccount
);
accountRouter.get(
  "/",
  authorizeRoles("fuel-admin"),
  LedgerController.listAccounts
);
accountRouter.get(
  "/:id",
  authorizeRoles("fuel-admin"),
  LedgerController.getAccount
);
accountRouter.put(
  "/:id",
  authorizeRoles("fuel-admin"),
  validateAccountUpdate,
  LedgerController.updateAccount
);
accountRouter.delete(
  "/:id",
  authorizeRoles("fuel-admin"),
  LedgerController.deleteAccount
);
accountRouter.get(
  "/:id/balance",
  authorizeRoles("fuel-admin"),
  validateDateRange,
  LedgerController.getAccountBalance
);
accountRouter.get(
  "/:id/protection",
  authorizeRoles("fuel-admin"),
  LedgerController.checkAccountProtection
);
router.use("/accounts", accountRouter); // Mounted at /api/tenant/ledger/accounts

// --- Voucher Management ---
// All voucher operations require fuel-admin role
const voucherRouter = Router();
voucherRouter.post(
  "/",
  authorizeRoles("fuel-admin"),
  validateVoucherCreation,
  LedgerController.createVoucher
);
voucherRouter.get(
  "/",
  authorizeRoles("fuel-admin"),
  validateDateRange,
  LedgerController.listVouchers
);
voucherRouter.get(
  "/:id",
  authorizeRoles("fuel-admin"),
  LedgerController.getVoucher
);
voucherRouter.patch(
  "/:id/cancel",
  authorizeRoles("fuel-admin"),
  LedgerController.cancelVoucher
);
voucherRouter.post(
  "/validate",
  authorizeRoles("fuel-admin"),
  validateVoucherCreation,
  LedgerController.validateVoucher
);
router.use("/vouchers", voucherRouter); // Mounted at /api/tenant/ledger/vouchers

// --- Reporting Endpoints ---
// All reporting requires fuel-admin role for financial data access
const reportRouter = Router();
reportRouter.get(
  "/trial-balance",
  authorizeRoles("fuel-admin"),
  validateDateRange,
  LedgerController.getTrialBalance
);
reportRouter.get(
  "/profit-loss",
  authorizeRoles("fuel-admin"),
  validateDateRange,
  LedgerController.getProfitLoss
);
reportRouter.get(
  "/balance-sheet",
  authorizeRoles("fuel-admin"),
  LedgerController.getBalanceSheet
);
reportRouter.get(
  "/general-ledger/:accountId",
  authorizeRoles("fuel-admin"),
  validateDateRange,
  LedgerController.getGeneralLedger
);
reportRouter.get(
  "/cash-flow",
  authorizeRoles("fuel-admin"),
  validateDateRange,
  LedgerController.getCashFlow
);
reportRouter.get(
  "/integrity-check",
  authorizeRoles("fuel-admin"),
  LedgerController.checkIntegrity
);
router.use("/reports", reportRouter); // Mounted at /api/tenant/ledger/reports

// --- Integration Routes ---
router.use("/integration", ledgerIntegrationRoutes); // Mounted at /api/tenant/ledger/integration

export default router;
