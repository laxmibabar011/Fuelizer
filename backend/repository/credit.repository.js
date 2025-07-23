import { initCreditModels } from '../models/credit.model.js';

export class CreditRepository {
  constructor(sequelize) {
    this.models = initCreditModels(sequelize);
  }

  // Create a new credit account
  async createCreditAccount(accountData, transaction) {
    return this.models.CreditAccount.create(accountData, { transaction });
  }

  // Find a credit account by contact email
  async findCreditAccountByContactEmail(contactEmail) {
    return this.models.CreditAccount.findOne({ where: { contactEmail } });
  }

  async getAllCreditAccounts() {
    return this.models.CreditAccount.findAll({
      order: [['createdAt', 'DESC']]
    });
  }

  async getCreditAccountById(id) {
    return this.models.CreditAccount.findByPk(id);
  }

  // VEHICLE METHODS
  async getVehiclesByPartnerId(partnerId) {
    return this.models.Vehicle.findAll({ where: { partnerId }, order: [['createdAt', 'DESC']] });
  }

  async addVehicles(partnerId, vehicles) {
    // vehicles: array of { vehicleNumber, type, model, capacity, fuelType, status }
    const vehiclesToCreate = vehicles.map(v => ({ ...v, partnerId }));
    return this.models.Vehicle.bulkCreate(vehiclesToCreate);
  }

  async updateVehicle(vehicleId, data) {
    const vehicle = await this.models.Vehicle.findByPk(vehicleId);
    if (!vehicle) return null;
    await vehicle.update(data);
    return vehicle;
  }

  async setVehicleStatus(vehicleId, status) {
    const vehicle = await this.models.Vehicle.findByPk(vehicleId);
    if (!vehicle) return null;
    await vehicle.update({ status });
    return vehicle;
  }

  async deleteVehicle(vehicleId) {
    return this.models.Vehicle.destroy({ where: { id: vehicleId } });
  }
} 

