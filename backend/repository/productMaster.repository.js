import { initProductMasterModels } from '../models/productMaster.model.js'

export class ProductMasterRepository {
  constructor(sequelize) {
    this.models = initProductMasterModels(sequelize)
  }

  // Categories
  async createCategory(payload) {
    return this.models.ProductCategory.create(payload)
  }

  async listCategories(filter = {}) {
    const where = { ...filter }
    if (typeof where.is_active === 'undefined') {
      where.is_active = true
    }
    return this.models.ProductCategory.findAll({ where, order: [['id', 'ASC']] })
  }

  async getCategoryById(id) {
    return this.models.ProductCategory.findByPk(id)
  }

  async updateCategory(id, patch) {
    const c = await this.getCategoryById(id)
    if (!c) return null
    await c.update(patch)
    return c
  }

  async deleteCategory(id) {
    const c = await this.getCategoryById(id)
    if (!c) return 0
    await c.update({ is_active: false })
    return 1
  }

  // Products
  async createProduct(payload) {
    return this.models.ProductMaster.create(payload)
  }

  async listProducts(query = {}) {
    const { category_type, category_id, status } = query
    const where = {}
    if (category_type) where.category_type = category_type
    if (category_id) where.category_id = category_id
    if (typeof status === 'undefined') {
      where.status = 'active'
    } else {
      where.status = status
    }
    return this.models.ProductMaster.findAll({ where, order: [['id', 'ASC']] })
  }

  async getProductById(id) {
    return this.models.ProductMaster.findByPk(id)
  }

  async updateProduct(id, patch) {
    const p = await this.getProductById(id)
    if (!p) return null
    await p.update(patch)
    return p
  }

  async deleteProduct(id) {
    const p = await this.getProductById(id)
    if (!p) return 0
    await p.update({ status: 'inactive' })
    return 1
  }
}


