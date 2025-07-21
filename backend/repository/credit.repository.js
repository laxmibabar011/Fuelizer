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
} 