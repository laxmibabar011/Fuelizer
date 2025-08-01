import { initMasterModels } from '../models/master.model.js';

export class MasterRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    const { User, Client, PasswordReset } = initMasterModels(sequelize);
    this.User = User;
    this.Client = Client;
    this.PasswordReset = PasswordReset;
  }

  async getSuperAdminByEmail(email) {
    return await this.User.findOne({ where: { email, role: 'super_admin' } });
  }

  async getSuperAdminById(id) {
    return await this.User.findByPk(id, { where: { role: 'super_admin' } });
  }

  async getAllSuperAdminUsers() {
    return await this.User.findAll({ where: { role: 'super_admin' } });
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

  async findAllClients() {
    return await this.Client.findAll();
  }

  async createSuperAdminUser(userData) {
    return await this.User.create({ ...userData, role: 'super_admin' });
  }

  async createClient(clientData) {
    return await this.Client.create(clientData);
  }

  async setClientActive(clientId, isActive) {
    return await this.Client.update({ is_active: isActive }, { where: { client_id: clientId } });
  }

  async createPasswordReset({ user_id, client_id, otp, expires_at }) {
    return await this.PasswordReset.create({ user_id, client_id, otp, expires_at });
  }

  async findValidPasswordReset({ user_id, client_id, otp }) {
    return await this.PasswordReset.findOne({
      where: {
        user_id,
        client_id,
        otp,
        used: false,
        expires_at: { [this.sequelize.Op.gt]: new Date() }
      }
    });
  }

  async markPasswordResetUsed(id) {
    return await this.PasswordReset.update({ used: true }, { where: { id } });
  }
}