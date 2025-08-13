import { initProductMasterModels } from '../models/productMaster.model.js'

export class ProductMasterRepository {
  constructor(sequelize) {
    this.models = initProductMasterModels(sequelize)
  }

  // Categories
  async createCategory(payload) {
    return this.models.ProductMasterCategory.create(payload)
  }

  async listCategories(filter = {}) {
    return this.models.ProductMasterCategory.findAll({ where: filter, order: [['id', 'ASC']] })
  }

  async getCategoryById(id) {
    return this.models.ProductMasterCategory.findByPk(id)
  }

  async updateCategory(id, patch) {
    const c = await this.getCategoryById(id)
    if (!c) return null
    await c.update(patch)
    return c
  }

  async deleteCategory(id) {
    return this.models.ProductMasterCategory.destroy({ where: { id } })
  }

  // Products
  async createProduct(payload) {
    return this.models.ProductMasterProduct.create(payload)
  }

  async listProducts(query = {}) {
    const { category_type, category_id } = query
    const where = {}
    if (category_type) where.category_type = category_type
    if (category_id) where.category_id = category_id
    return this.models.ProductMasterProduct.findAll({ where, order: [['id', 'ASC']] })
  }

  async getProductById(id) {
    return this.models.ProductMasterProduct.findByPk(id)
  }

  async updateProduct(id, patch) {
    const p = await this.getProductById(id)
    if (!p) return null
    await p.update(patch)
    return p
  }

  async deleteProduct(id) {
    return this.models.ProductMasterProduct.destroy({ where: { id } })
  }
}


