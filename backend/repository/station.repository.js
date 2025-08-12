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
  async ensureFuelProducts(seed = ['Petrol', 'Diesel', 'Power Petrol']) {
    for (const name of seed) {
      // @ts-ignore
      const [p] = await this.models.Product.findOrCreate({ where: { name }, defaults: { name, category: 'Fuel' } });
    }
    return this.models.Product.findAll({ where: { category: 'Fuel' }, order: [['name', 'ASC']] });
  }
}


