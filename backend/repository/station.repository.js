import { initStationModels } from '../models/station.model.js';

export class StationRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.models = initStationModels(sequelize);
  }

  // Ensure the given id points to an existing Product row.
  // If the id refers to ProductMaster, mirror it into Product and return the Product id.
  async resolveProductId(inputId) {
    if (inputId === undefined || inputId === null) return null;

    // If a Product with this id exists, use it directly
    const existingProduct = await this.models.Product.findByPk(inputId);
    if (existingProduct) return existingProduct.id;

    // Otherwise, see if this id is a ProductMaster id and mirror by name
    const ProductMaster = this.sequelize?.models?.ProductMaster;
    if (ProductMaster) {
      const pm = await ProductMaster.findByPk(inputId);
      if (pm) {
        const [product] = await this.models.Product.findOrCreate({
          where: { name: pm.name },
          defaults: { name: pm.name, category: 'Fuel' }
        });
        return product.id;
      }
    }

    // Fallback: invalid id
    throw new Error('Invalid productId: not found in Product or ProductMaster');
  }

  // Booths
  async listBooths() {
    return this.models.Booth.findAll({ 
      order: [['id', 'ASC']], 
      include: [{ 
        model: this.models.Nozzle,
        include: [{ model: this.models.Product }]
      }] 
    });
  }

  async createBooth(data) {
    return this.models.Booth.create(data);
  }

  async updateBooth(id, data) {
    const booth = await this.models.Booth.findByPk(id);
    if (!booth) return null;
    await booth.update(data);
    return booth;
  }

  async deleteBooth(id) {
    return this.models.Booth.destroy({ where: { id } });
  }

  // Nozzles (simple CRUD)
  async listNozzles() {
    return this.models.Nozzle.findAll({
      include: [
        { model: this.models.Booth, attributes: ['name', 'code'] },
        { model: this.models.Product, attributes: ['name'] }
      ],
      order: [['id', 'ASC']]
    });
  }

  async createNozzle(data) {
    const resolvedProductId = await this.resolveProductId(data.productId);
    const nozzle = await this.models.Nozzle.create({
      boothId: data.boothId,
      code: data.code,
      productId: resolvedProductId,
      status: 'active'
    });
    await nozzle.reload({
      include: [
        { model: this.models.Booth, attributes: ['name', 'code'] },
        { model: this.models.Product, attributes: ['name'] }
      ]
    });
    return nozzle;
  }

  async updateNozzle(id, data) {
    const nozzle = await this.models.Nozzle.findByPk(id);
    if (!nozzle) return null;

    const updates = { updatedAt: new Date() };
    if (data.code !== undefined) updates.code = data.code;
    if (data.productId !== undefined) {
      updates.productId = await this.resolveProductId(data.productId);
    }

    await nozzle.update(updates);
    await nozzle.reload({
      include: [
        { model: this.models.Booth, attributes: ['name', 'code'] },
        { model: this.models.Product, attributes: ['name'] }
      ]
    });
    return nozzle;
  }

  async deleteNozzle(id) {
    return this.models.Nozzle.destroy({ where: { id } });
  }

  // Products (minimal for mapping)
  // async ensureFuelProducts(seed = ['Petrol', 'Diesel', 'Power Petrol']) {
  //   for (const name of seed) {
  //     // @ts-ignore
  //     const [p] = await this.models.Product.findOrCreate({ where: { name }, defaults: { name, category: 'Fuel' } });
  //   }
  //   return this.models.Product.findAll({ where: { category: 'Fuel' }, order: [['name', 'ASC']] });
  // }
}


