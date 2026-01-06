import { Router } from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js'
import ProductController from '../controller/product.controller.js' // Renamed controller
import { uploadSingle } from '../middleware/multer.middleware.js'

const router = Router()

// Apply authentication and tenant middleware to all routes
router.use(authenticate, tenantDbMiddleware)

// --- Product Categories ---
// Read access for operators, write access for fuel-admin
const categoryRouter = Router()
categoryRouter.post('/', authorizeRoles('fuel-admin'), ProductController.createCategory)
categoryRouter.get('/', authorizeRoles('fuel-admin', 'operator'), ProductController.listCategories)
categoryRouter.put('/:id', authorizeRoles('fuel-admin'), ProductController.updateCategory)
categoryRouter.delete('/:id', authorizeRoles('fuel-admin'), ProductController.deleteCategory)
router.use('/categories', categoryRouter) // Mounted at /api/categories

// --- Units of Measure (UoM) ---
// New routes for managing units
const uomRouter = Router()
uomRouter.post('/', authorizeRoles('fuel-admin'), ProductController.createUom)
uomRouter.get('/', authorizeRoles('fuel-admin', 'operator'), ProductController.listUoms)
router.use('/uom', uomRouter) // Mounted at /api/uom

// --- Products ---
// Read access for operators, write access for fuel-admin
const productRouter = Router()
productRouter.post('/', authorizeRoles('fuel-admin'), uploadSingle('image'), ProductController.createProduct)
productRouter.get('/', authorizeRoles('fuel-admin', 'operator'), ProductController.listProducts)
productRouter.get('/purchase', authorizeRoles('fuel-admin', 'operator'), ProductController.getProductsForPurchase) // New endpoint for purchase module
productRouter.get('/:id', authorizeRoles('fuel-admin', 'operator'), ProductController.getProduct)
productRouter.put('/:id', authorizeRoles('fuel-admin'), uploadSingle('image'), ProductController.updateProduct)
productRouter.delete('/:id', authorizeRoles('fuel-admin'), ProductController.deleteProduct)
router.use('/products', productRouter) // Mounted at /api/products

// --- Inventory Management (Separate for clarity) ---
const inventoryRouter = Router()
// Route to get current inventory levels
inventoryRouter.get('/', authorizeRoles('fuel-admin', 'operator'), ProductController.getInventoryLevels)
// Route for making a manual stock adjustment (e.g., for damage or initial entry)
inventoryRouter.post('/adjust', authorizeRoles('fuel-admin'), ProductController.adjustInventory)
router.use('/inventory', inventoryRouter) // Mounted at /api/inventory

export default router