import { initMasterModels } from '../models/master.model.js';

export class MasterRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    const { User, Client, PasswordReset } = initMasterModels(sequelize);
    this.User = User;
    this.Client = Client;
    this.PasswordReset = PasswordReset;
  }

  // Create a new client (organization)
  async createClient(clientData) {
    return this.models.Client.create(clientData);
  }

  // Find a client by client_id (unique)
  async findClientById(clientId) {
    return this.models.Client.findOne({ where: { client_id: clientId } });
  }

  // Create a super-admin user in master DB
  async createSuperAdminUser(userData) {
    return this.models.User.create({ ...userData, role: 'super_admin' });
  }

  // Find a super-admin user by email in master DB
  async findSuperAdminUserByEmail(email) {
    return this.models.User.findOne({ where: { email, role: 'super_admin' } });
  }

  // List all clients
  async getAllClients() {
    return this.models.Client.findAll();
  }

  async getSuperAdminByEmail(email) {
    return await this.User.findOne({ where: { email, role: 'super_admin' } });
  }

  async getSuperAdminById(id) {
    return await this.User.findByPk(id, { where: { role: 'super_admin' } });
  }

  async updateSuperAdminRefreshToken(userId, data) {
    return await this.User.update(
      {
        refresh_token: data.refresh_token,
        refresh_token_expires_at: data.refresh_token_expires_at,
        refresh_token_revoked: data.refresh_token_revoked
      },
      { where: { id: userId, role: 'super_admin' } }
    );
  }

  async findClientById(clientId) {
    return await this.Client.findOne({ where: { client_id: clientId } });
  }

  // Set client active/inactive
  async setClientActive(clientId, isActive) {
    return this.models.Client.update({ is_active: isActive }, { where: { client_id: clientId } });
  }

  // PasswordReset methods for forgot password/OTP
  // Create a new OTP record
  async createPasswordReset({ user_id, client_id, otp, expires_at }) {
    return this.models.PasswordReset.create({ user_id, client_id, otp, expires_at });
  }

  // Find a valid (not used, not expired) OTP for a user
  async findValidPasswordReset({ user_id, client_id, otp }) {
    return this.models.PasswordReset.findOne({
      where: {
        user_id,
        client_id,
        otp,
        used: false,
        expires_at: { [this.models.PasswordReset.sequelize.Op.gt]: new Date() }
      }
    });
  }
  // Mark an OTP as used
  async markPasswordResetUsed(id) {
    return this.models.PasswordReset.update({ used: true }, { where: { id } });
  }
}