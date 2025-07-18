import { initCreditModels } from '../models/credit.model.js';

export class CreditRepository {
  constructor(sequelize) {
    this.models = initCreditModels(sequelize);
  }

  async createCreditCustomer(customerData, transaction) {
    return this.models.CreditCustomer.create(customerData, { transaction });
  }

  async createCustomerUser(userData, transaction) {
    return this.models.CustomerUser.create(userData, { transaction });
  }

  async findCreditCustomerByEmail(contactEmail) {
    return this.models.CreditCustomer.findOne({ where: { contactEmail } });
  }
} 