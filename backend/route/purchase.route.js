import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'; // Assuming you may want roles later
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js';
import PurchaseController from '../controller/purchase.controller.js';
import ProductController from '../controller/product.controller.js';

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticate, tenantDbMiddleware);

// --- Vendor Routes (No changes needed here) ---
router.post('/vendors', PurchaseController.createVendor);
router.get('/vendors', PurchaseController.listVendors);
router.get('/vendors/:id', PurchaseController.getVendor);
router.put('/vendors/:id', PurchaseController.updateVendor);
router.delete('/vendors/:id', PurchaseController.deleteVendor); // Soft delete (deactivates)

// --- Purchase Routes (Formerly Purchase Orders) ---
router.post('/purchases', PurchaseController.createPurchase);
router.get('/purchases', PurchaseController.listPurchases);
router.get('/purchases/:id', PurchaseController.getPurchase);
router.put('/purchases/:id', PurchaseController.updatePurchase);
router.delete('/purchases/:id', PurchaseController.softDeletePurchase); // Soft delete with stock reversal
router.post('/purchases/:id/restore', PurchaseController.restorePurchase); // Restore deleted purchase
router.get('/purchases/:id/diagnostics', PurchaseController.purchaseDeleteDiagnostics); // Diagnostics for delete issues

// --- Purchase Action Routes ---
router.post('/purchases/:id/update-stock', PurchaseController.updateStockPurchase);
// This is the key workflow endpoint to update inventory.
router.post('/purchases/:id/receive', PurchaseController.receivePurchaseInventory);
// Diagnostic
router.get('/purchases/status-enum-info', PurchaseController.getStatusEnumInfo);

// --- Utility Routes for the Purchase UI ---
router.get('/purchase-products', ProductController.getProductsForPurchase); // Updated to use ProductController
router.post('/purchase-calculate-item', PurchaseController.calculateItemTotal);

export default router;