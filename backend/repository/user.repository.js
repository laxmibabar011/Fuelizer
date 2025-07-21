import { initTenantModels } from '../models/user.model.js';

export class UserRepository {
  constructor(sequelize) {
    this.models = initTenantModels(sequelize);
  }

  // Create a user in the tenant DB
  async createTenantUser(userData) {
    return this.models.User.create(userData);
  }

  // Find a user by email in the tenant DB
  async findTenantUserByEmail(email) {
    return this.models.User.findOne({ where: { email } });
  }
}