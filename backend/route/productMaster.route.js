import { Router } from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js'
import ProductMasterController from '../controller/productMaster.controller.js'
import { uploadSingle } from '../middleware/multer.middleware.js'

const router = Router()

// Tenant scoped routes; fuel-admin manages inventory
router.use(authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'))

// Categories
router.post('/product-master/categories', ProductMasterController.createCategory)
router.get('/product-master/categories', ProductMasterController.listCategories)
router.put('/product-master/categories/:id', ProductMasterController.updateCategory)
router.delete('/product-master/categories/:id', ProductMasterController.deleteCategory)

// Products
router.post('/product-master/products', uploadSingle('image'), ProductMasterController.createProduct)
router.get('/product-master/products', ProductMasterController.listProducts)
router.get('/product-master/products/:id', ProductMasterController.getProduct)
router.put('/product-master/products/:id', uploadSingle('image'), ProductMasterController.updateProduct)
router.delete('/product-master/products/:id', ProductMasterController.deleteProduct)
router.patch('/product-master/products/:id/restore', ProductMasterController.restoreProduct)

export default router


