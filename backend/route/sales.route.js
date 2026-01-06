import { Router } from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js'
import SalesController from '../controller/sales.controller.js'

const router = Router()

router.use(authenticate, tenantDbMiddleware)

// List sales (Posted/Draft)
router.get('/', authorizeRoles('fuel-admin', 'operator'), SalesController.list)

// Manual create
router.post('/', authorizeRoles('fuel-admin'), SalesController.createManual)

// POS preview and export
router.get('/pos-preview', authorizeRoles('fuel-admin'), SalesController.previewPos)
router.post('/pos-export', authorizeRoles('fuel-admin'), SalesController.exportPos)

// Payment methods for dropdowns
router.get('/payment-methods', authorizeRoles('fuel-admin', 'operator'), SalesController.getPaymentMethods)

export default router


