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

  // Create a role in the tenant DB
  async createRole(roleData) {
    return this.models.Role.create(roleData);
  }

  // Create user details in the tenant DB
  async createUserDetails(detailsData) {
    return this.models.UserDetails.create(detailsData);
  }

  // Create a refresh token in the tenant DB
  async createRefreshToken(tokenData) {
    return this.models.RefreshToken.create(tokenData);
  }

  // Find a valid refresh token in the tenant DB
  async findValidRefreshToken({ user_id, token }) {
    return this.models.RefreshToken.findOne({
      where: {
        user_id,
        token,
        revoked: false,
        expires_at: { [this.models.RefreshToken.sequelize.Op.gt]: new Date() }
      }
    });
  }

  // Revoke a refresh token in the tenant DB
  async revokeRefreshToken({ user_id, token }) {
    return this.models.RefreshToken.update(
      { revoked: true },
      { where: { user_id, token } }
    );
  }
}