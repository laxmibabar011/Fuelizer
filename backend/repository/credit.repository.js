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
} 