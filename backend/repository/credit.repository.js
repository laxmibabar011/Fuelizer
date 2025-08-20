import { initCreditModels } from '../models/credit.model.js';

export class CreditRepository {
  constructor(sequelize) {
    this.models = initCreditModels(sequelize);
  }

  // Create a new credit account
  async createCreditAccount(accountData, options = {}) {
    return this.models.CreditAccount.create(accountData, options);
  }

  // Find a credit account by contact email
  async findCreditAccountByContactEmail(contactEmail) {
    return this.models.CreditAccount.findOne({ where: { contactEmail } });
  }

  // Get all credit accounts
  async getAllCreditAccounts() {
    return this.models.CreditAccount.findAll({
      order: [['createdAt', 'DESC']]
    });
  }

  // Get credit account by ID
  async getCreditAccountById(id) {
    return this.models.CreditAccount.findByPk(id);
  }

  // Get vehicles by partner ID
  async getVehiclesByPartnerId(partnerId) {
    return this.models.Vehicle.findAll({ where: { partnerId }, order: [['createdAt', 'DESC']] });
  }

  // Add vehicles for a partner (bulk)
  async addVehicles(partnerId, vehicles) {
    const vehiclesToCreate = vehicles.map(v => ({ ...v, partnerId }));
    return this.models.Vehicle.bulkCreate(vehiclesToCreate);
  }

  // Update a vehicle
  async updateVehicle(vehicleId, data) {
    const vehicle = await this.models.Vehicle.findByPk(vehicleId);
    if (!vehicle) return null;
    await vehicle.update(data);
    return vehicle;
  }

  // Set vehicle status
  async setVehicleStatus(vehicleId, status) {
    const vehicle = await this.models.Vehicle.findByPk(vehicleId);
    if (!vehicle) return null;
    await vehicle.update({ status });
    return vehicle;
  }

  // Delete a vehicle
  async deleteVehicle(vehicleId) {
    return this.models.Vehicle.destroy({ where: { id: vehicleId } });
  }

  // Update credit limit for a credit account
  async updateCreditLimit(partnerId, creditLimit, utilisedBod, adhocAddition) {
    const account = await this.models.CreditAccount.findByPk(partnerId);
    if (!account) return null;
    await account.update({ 
      creditLimit: creditLimit || account.creditLimit,
      utilisedBod: utilisedBod !== undefined ? utilisedBod : account.utilisedBod,
      adhocAddition: adhocAddition !== undefined ? adhocAddition : account.adhocAddition
    });
    return account;
  }
}