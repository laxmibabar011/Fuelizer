import { initTenantModels } from '../models/user.model.js';

export class UserRepository {
  constructor(sequelize) {
    this.models = initTenantModels(sequelize);
  }

  async createUser(userData) {
    return this.models.User.create(userData);
  }

  async findUserByEmail(email) {
    return this.models.User.findOne({ where: { email } });
  }
}