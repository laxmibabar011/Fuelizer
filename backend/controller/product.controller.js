import { sendResponse } from '../util/response.util.js'
import { ProductRepository } from '../repository/product.repository.js' // <-- Renamed repository
import { getTenantDbModels } from './helper/tenantDb.helper.js'

export default class ProductController {
  
  // A helper to get models and repository for the current tenant
  static async _getRepo(req) {
      // Prefer tenant sequelize from middleware; fallback to resolver only if missing
      if (req.tenantSequelize) {
        return new ProductRepository(req.tenantSequelize);
      }
      const { tenantSequelize } = await getTenantDbModels(req.user?.tenantDbName || req.tenant?.db_name);
      return new ProductRepository(tenantSequelize);
  }

  // --- Categories ---
  static async createCategory(req, res) {
    try {
      const { name, description, category_type } = req.body
      if (!name) return sendResponse(res, { success: false, error: 'Category name is required', status: 400 })
      if (!category_type) return sendResponse(res, { success: false, error: 'Category type is required', status: 400 })

      // Validate category_type
      const validCategoryTypes = ['Fuel', 'Non-Fuel']
      if (!validCategoryTypes.includes(category_type)) {
        return sendResponse(res, { success: false, error: 'Category type must be either "Fuel" or "Non-Fuel"', status: 400 })
      }

      const repo = await ProductController._getRepo(req)
      const category = await repo.createCategory({ name, description, category_type })
      
      return sendResponse(res, { data: category, message: 'Category created', status: 201 })
    } catch (err) {
      // Handle potential unique constraint error (e.g., duplicate name)
      if (err.name === 'SequelizeUniqueConstraintError') {
          return sendResponse(res, { success: false, error: 'A category with this name already exists.', status: 409 });
      }
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create category', status: 500 })
    }
  }

  static async listCategories(req, res) {
    try {
      const repo = await ProductController._getRepo(req)
      const filter = {}
      if (req.query.is_active) {
        filter.is_active = (req.query.is_active === 'true')
      }
      const list = await repo.listCategories(filter)
      return sendResponse(res, { data: list })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch categories', status: 500 })
    }
  }

  static async updateCategory(req, res) {
    try {
      const { category_type } = req.body
      
      // Validate category_type if provided
      if (category_type) {
        const validCategoryTypes = ['Fuel', 'Non-Fuel']
        if (!validCategoryTypes.includes(category_type)) {
          return sendResponse(res, { success: false, error: 'Category type must be either "Fuel" or "Non-Fuel"', status: 400 })
        }
      }

      const repo = await ProductController._getRepo(req)
      const updated = await repo.updateCategory(req.params.id, req.body)
      if (!updated) return sendResponse(res, { success: false, error: 'Category not found', status: 404 })
      return sendResponse(res, { data: updated, message: 'Category updated' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update category', status: 500 })
    }
  }

  static async deleteCategory(req, res) {
    try {
      const repo = await ProductController._getRepo(req)
      const deletedCount = await repo.deleteCategory(req.params.id)
      if (deletedCount === 0) {
        return sendResponse(res, { success: false, error: 'Category not found', status: 404 })
      }
      return sendResponse(res, { message: 'Category deactivated successfully' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete category', status: 500 })
    }
  }

  // --- Units of Measure (UoM) ---
  static async createUom(req, res) {
    try {
        const { name, code } = req.body;
        if (!name || !code) return sendResponse(res, { success: false, error: 'Name and code are required for UoM', status: 400 });

        const repo = await ProductController._getRepo(req);
        const uom = await repo.createUom({ name, code });
        
        return sendResponse(res, { data: uom, message: 'Unit of Measure created', status: 201 });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return sendResponse(res, { success: false, error: 'A UoM with this name or code already exists.', status: 409 });
        }
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to create UoM', status: 500 });
    }
  }

  static async listUoms(req, res) {
    try {
        const repo = await ProductController._getRepo(req);
        const list = await repo.listUoms();
        return sendResponse(res, { data: list });
    } catch (err) {
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch UoMs', status: 500 });
    }
  }

  // --- Products ---
  static async createProduct(req, res) {
    try {
      const repo = await ProductController._getRepo(req)
      const payload = { ...req.body }

      // Enhanced validation with new tax fields
      if (!payload.name || !payload.item_code || !payload.category_id || !payload.uom_id || !payload.sales_price) {
          return sendResponse(res, { success: false, error: 'Missing required fields: name, item_code, category_id, uom_id, sales_price', status: 400 })
      }

      // Validate taxability and tax rates
      const validTaxability = ['taxable', 'exempt', 'nil_rated', 'non_gst']
      if (payload.taxability && !validTaxability.includes(payload.taxability)) {
          return sendResponse(res, { success: false, error: 'Invalid taxability. Must be one of: taxable, exempt, nil_rated, non_gst', status: 400 })
      }

      // Validate tax rates are non-negative
      const taxFields = ['gst_rate', 'cgst_rate', 'sgst_rate', 'igst_rate', 'cess_rate', 'tcs_rate']
      for (const field of taxFields) {
        if (payload[field] && (payload[field] < 0 || payload[field] > 100)) {
          return sendResponse(res, { success: false, error: `${field} must be between 0 and 100`, status: 400 })
        }
      }

      // Validate pricing
      if (payload.sales_price && payload.sales_price < 0) {
          return sendResponse(res, { success: false, error: 'Sales price cannot be negative', status: 400 })
      }
      if (payload.cost_price && payload.cost_price < 0) {
          return sendResponse(res, { success: false, error: 'Cost price cannot be negative', status: 400 })
      }

      if (req.filePath) {
        payload.image_url = req.filePath
      }
      
      const product = await repo.createProduct(payload)
      return sendResponse(res, { data: product, message: 'Product created successfully', status: 201 })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create product', status: 500 })
    }
  }

  static async listProducts(req, res) {
    try {
      const repo = await ProductController._getRepo(req)
      const list = await repo.listProducts(req.query)
      return sendResponse(res, { data: list })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch products', status: 500 })
    }
  }

  // New endpoint specifically for purchase module
  static async getProductsForPurchase(req, res) {
    try {
      const repo = await ProductController._getRepo(req)
      const list = await repo.getProductsForPurchase(req.query)
      return sendResponse(res, { data: list })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch products for purchase', status: 500 })
    }
  }

  static async getProduct(req, res) {
    try {
      const repo = await ProductController._getRepo(req)
      const product = await repo.getProductById(req.params.id)
      if (!product) return sendResponse(res, { success: false, error: 'Product not found', status: 404 })
      return sendResponse(res, { data: product })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch product', status: 500 })
    }
  }
  
  static async updateProduct(req, res) {
    try {
      const repo = await ProductController._getRepo(req)
      const payload = { ...req.body }
      // You should not be able to update stock directly via this endpoint.
      delete payload.quantity_on_hand;

      // Validate taxability and tax rates if provided
      if (payload.taxability) {
        const validTaxability = ['taxable', 'exempt', 'nil_rated', 'non_gst']
        if (!validTaxability.includes(payload.taxability)) {
            return sendResponse(res, { success: false, error: 'Invalid taxability. Must be one of: taxable, exempt, nil_rated, non_gst', status: 400 })
        }
      }

      // Validate tax rates are non-negative if provided
      const taxFields = ['gst_rate', 'cgst_rate', 'sgst_rate', 'igst_rate', 'cess_rate', 'tcs_rate']
      for (const field of taxFields) {
        if (payload[field] && (payload[field] < 0 || payload[field] > 100)) {
          return sendResponse(res, { success: false, error: `${field} must be between 0 and 100`, status: 400 })
        }
      }

      // Validate pricing if provided
      if (payload.sales_price && payload.sales_price < 0) {
          return sendResponse(res, { success: false, error: 'Sales price cannot be negative', status: 400 })
      }
      if (payload.cost_price && payload.cost_price < 0) {
          return sendResponse(res, { success: false, error: 'Cost price cannot be negative', status: 400 })
      }

      if (req.filePath) {
        payload.image_url = req.filePath
      }
      
      const updated = await repo.updateProduct(req.params.id, payload)
      if (!updated) return sendResponse(res, { success: false, error: 'Product not found', status: 404 })
      return sendResponse(res, { data: updated, message: 'Product updated' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update product', status: 500 })
    }
  }

  static async deleteProduct(req, res) {
    try {
      const repo = await ProductController._getRepo(req)
      const deletedCount = await repo.deleteProduct(req.params.id)
      if (deletedCount === 0) return sendResponse(res, { success: false, error: 'Product not found', status: 404 })
      return sendResponse(res, { message: 'Product deactivated successfully' })
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete product', status: 500 })
    }
  }

  // --- Inventory ---
  static async getInventoryLevels(req, res) {
    try {
        const repo = await ProductController._getRepo(req);
        const levels = await repo.getInventoryLevels();
        return sendResponse(res, { data: levels });
    } catch(err) {
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch inventory levels', status: 500 });
    }
  }

  static async adjustInventory(req, res) {
      try {
          const { product_id, new_quantity, reason } = req.body;
          if (!product_id || new_quantity === undefined) {
              return sendResponse(res, { success: false, error: 'product_id and new_quantity are required.', status: 400 });
          }
          const repo = await ProductController._getRepo(req);
          const updatedItem = await repo.adjustInventory(product_id, new_quantity, reason);
          return sendResponse(res, { data: updatedItem, message: 'Inventory adjusted successfully.' });

      } catch(err) {
        return sendResponse(res, { success: false, error: err.message, message: 'Failed to adjust inventory', status: 500 });
      }
  }
}