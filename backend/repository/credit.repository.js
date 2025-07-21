import { initCreditModels } from '../models/credit.model.js';

export class CreditRepository {
  constructor(sequelize) {
    this.models = initCreditModels(sequelize);
  }

  // Create a new credit account (CreditCustomer)
  async createCreditAccount(accountData, transaction) {
    return this.models.CreditCustomer.create(accountData, { transaction });
  }

  // Find a credit account by contact email
  async findCreditAccountByContactEmail(contactEmail) {
    return this.models.CreditCustomer.findOne({ where: { contactEmail } });
  }

  async getAllCreditCustomers() {
    return this.models.CreditCustomer.findAll({
      include: [this.models.CustomerUser],
      order: [['createdAt', 'DESC']]
    });
  }

  async getCreditCustomerById(id) {
    return this.models.CreditCustomer.findByPk(id, {
      include: [this.models.CustomerUser]
    });
  }
} 