import { sendResponse } from '../util/response.util.js'
import { ProductMasterRepository } from '../repository/productMaster.repository.js'

export default class ProductMasterController {
  // Categories
  static async createCategory(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const { category_type, name, description, is_active } = req.body
      if (!category_type) return sendResponse(res, { success: false, error: 'category_type required', status: 400 })
      if (category_type === 'Other Product' && !name) return sendResponse(res, { success: false, error: 'name required for Other Product', status: 400 })
      const c = await repo.createCategory({ category_type, name: name || null, description, is_active: is_active ?? true })
      return sendResponse(res, { data: c, message: 'Category created', status: 201 })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create category', status: 500 })
    }
  }

  static async listCategories(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const { category_type, is_active } = req.query
      const filter = {}
      if (category_type) filter.category_type = category_type
      if (typeof is_active !== 'undefined') {
        // normalize boolean from query string
        filter.is_active = (is_active === 'true' || is_active === true)
      }
      const list = await repo.listCategories(filter)
      return sendResponse(res, { data: list })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch categories', status: 500 })
    }
  }

  static async updateCategory(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const { id } = req.params
      const updated = await repo.updateCategory(id, req.body)
      if (!updated) return sendResponse(res, { success: false, error: 'Not found', status: 404 })
      return sendResponse(res, { data: updated, message: 'Category updated' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update category', status: 500 })
    }
  }

  static async deleteCategory(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const { id } = req.params
      const deleted = await repo.deleteCategory(id)
      if (!deleted) return sendResponse(res, { success: false, error: 'Not found', status: 404 })
      return sendResponse(res, { data: {}, message: 'Category archived' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete category', status: 500 })
    }
  }

  // Products
  static async createProduct(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const payload = { ...req.body }
      // If multer handled a file, prefer its static path
      if (req.filePath) {
        payload.image_url = req.filePath
      }
      if (!payload.category_type) return sendResponse(res, { success: false, error: 'category_type required', status: 400 })
      if (payload.category_type === 'Other Product' && !payload.category_id) return sendResponse(res, { success: false, error: 'category_id required for Other Product', status: 400 })
      const p = await repo.createProduct(payload)
      return sendResponse(res, { data: p, message: 'Product created', status: 201 })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create product', status: 500 })
    }
  }

  static async listProducts(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const list = await repo.listProducts(req.query)
      return sendResponse(res, { data: list })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch products', status: 500 })
    }
  }

  static async getProduct(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const p = await repo.getProductById(req.params.id)
      if (!p) return sendResponse(res, { success: false, error: 'Not found', status: 404 })
      return sendResponse(res, { data: p })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch product', status: 500 })
    }
  }

  static async updateProduct(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const payload = { ...req.body }
      if (req.filePath) {
        payload.image_url = req.filePath
      }
      const updated = await repo.updateProduct(req.params.id, payload)
      if (!updated) return sendResponse(res, { success: false, error: 'Not found', status: 404 })
      return sendResponse(res, { data: updated, message: 'Product updated' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update product', status: 500 })
    }
  }

  static async deleteProduct(req, res) {
    try {
      const repo = new ProductMasterRepository(req.tenantSequelize)
      const deleted = await repo.deleteProduct(req.params.id)
      if (!deleted) return sendResponse(res, { success: false, error: 'Not found', status: 404 })
      return sendResponse(res, { data: {}, message: 'Product archived' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete product', status: 500 })
    }
  }
}


