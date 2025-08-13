import { initStationModels } from '../models/station.model.js';

export class StationRepository {
  constructor(sequelize) {
    this.models = initStationModels(sequelize);
  }

  // Booths
  async listBooths() {
    return this.models.Booth.findAll({ order: [['id', 'ASC']], include: [{ model: this.models.Nozzle }] });
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

  // Nozzles
  async listNozzles(boothId) {
    return this.models.Nozzle.findAll({ where: { boothId }, include: [{ model: this.models.Product }] });
  }

  async upsertNozzle(boothId, nozzle) {
    if (nozzle.id) {
      const existing = await this.models.Nozzle.findByPk(nozzle.id);
      if (!existing) return null;
      await existing.update({ code: nozzle.code, productId: nozzle.productId, status: nozzle.status, updatedAt: new Date() });
      return existing;
    }
    return this.models.Nozzle.create({ boothId, code: nozzle.code, productId: nozzle.productId || null, status: nozzle.status || 'active' });
  }

  async deleteNozzle(id) {
    return this.models.Nozzle.destroy({ where: { id } });
  }

  // Products (minimal for mapping)
  async ensureFuelProductsFromMaster(pmModels) {
    // Populate station.Product from ProductMasterProduct where category_type = 'Fuel'
    const fuelProducts = await pmModels.ProductMasterProduct.findAll({ where: { category_type: 'Fuel' }, order: [['name', 'ASC']] })
    for (const fp of fuelProducts) {
      // Create if not exists in station.Product by name
      // @ts-ignore
      await this.models.Product.findOrCreate({ where: { name: fp.name }, defaults: { name: fp.name, category: 'Fuel' } })
    }
    return this.models.Product.findAll({ where: { category: 'Fuel' }, order: [['name', 'ASC']] })
  }
}


