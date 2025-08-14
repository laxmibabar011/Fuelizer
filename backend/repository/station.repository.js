import { initStationModels } from '../models/station.model.js';

export class StationRepository {
  constructor(sequelize) {
    this.models = initStationModels(sequelize);
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
    return this.models.Nozzle.create({
      boothId: data.boothId,
      code: data.code,
      productId: data.productId || null,
      status: 'active'
    });
  }

  async updateNozzle(id, data) {
    const nozzle = await this.models.Nozzle.findByPk(id);
    if (!nozzle) return null;
    await nozzle.update({
      code: data.code,
      productId: data.productId,
      updatedAt: new Date()
    });
    return nozzle;
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


