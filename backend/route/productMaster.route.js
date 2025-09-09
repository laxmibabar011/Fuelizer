import { Router } from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js'
import ProductMasterController from '../controller/productMaster.controller.js'
import { uploadSingle } from '../middleware/multer.middleware.js'

const router = Router()

// Apply authentication and tenant middleware to all routes
router.use(authenticate, tenantDbMiddleware)

// Categories - Read access for operators (POS system), write access for fuel-admin
router.post('/product-master/categories', authorizeRoles('fuel-admin'), ProductMasterController.createCategory)
router.get('/product-master/categories', authorizeRoles('fuel-admin', 'operator'), ProductMasterController.listCategories)
router.put('/product-master/categories/:id', authorizeRoles('fuel-admin'), ProductMasterController.updateCategory)
router.delete('/product-master/categories/:id', authorizeRoles('fuel-admin'), ProductMasterController.deleteCategory)

// Products - Read access for operators (POS system), write access for fuel-admin
router.post('/product-master/products', authorizeRoles('fuel-admin'), uploadSingle('image'), ProductMasterController.createProduct)
router.get('/product-master/products', authorizeRoles('fuel-admin', 'operator'), ProductMasterController.listProducts)
router.get('/product-master/products/:id', authorizeRoles('fuel-admin', 'operator'), ProductMasterController.getProduct)
router.put('/product-master/products/:id', authorizeRoles('fuel-admin'), uploadSingle('image'), ProductMasterController.updateProduct)
router.delete('/product-master/products/:id', authorizeRoles('fuel-admin'), ProductMasterController.deleteProduct)
router.patch('/product-master/products/:id/restore', authorizeRoles('fuel-admin'), ProductMasterController.restoreProduct)

export default router


