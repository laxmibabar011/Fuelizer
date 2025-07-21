import { initMasterModels } from '../models/master.model.js';

export class MasterRepository {
  constructor(sequelize) {
    this.models = initMasterModels(sequelize);
  }

  // Create a new client (organization)
  async createClient(clientData) {
    return this.models.Client.create(clientData);
  }

  // Find a client by client_key (unique)
  async findClientByKey(client_key) {
    return this.models.Client.findOne({ where: { client_key } });
  }

  // Create a user in the master DB
  async createMasterUser(userData) {
    return this.models.User.create(userData);
  }

  // Find a user by email in the master DB
  async findMasterUserByEmail(email) {
    return this.models.User.findOne({ where: { email } });
  }

  // List all clients
  async getAllClients() {
    return this.models.Client.findAll();
  }
  
  // Get client by ID
  async getClientById(id) {
    return this.models.Client.findByPk(id);
  }
  
  // List all users (across all clients) in master DB
  async getAllMasterUsers() {
    return this.models.User.findAll();
  }
  
  // Get user by ID in master DB
  async getMasterUserById(id) {
    return this.models.User.findByPk(id);
  }

  // Update a user's access_token by user ID in master DB
  async updateMasterUserAccessToken(userId, accessToken) {
    return this.models.User.update({ access_token: accessToken }, { where: { id: userId } });
  }
  async setClientActive(id, isActive) {
    return this.models.Client.update({ is_active: isActive }, { where: { id } });
  }
  // Set user active/inactive in master DB
  async setMasterUserActive(id, isActive) {
    return this.models.User.update({ is_active: isActive }, { where: { id } });
  }

  // PasswordReset methods for forgot password/OTP
  // Create a new OTP record
  async createPasswordReset({ user_id, otp, expires_at }) {
    return this.models.PasswordReset.create({ user_id, otp, expires_at });
  }
  // Find a valid (not used, not expired) OTP for a user
  async findValidPasswordReset({ user_id, otp }) {
    return this.models.PasswordReset.findOne({
      where: {
        user_id,
        otp,
        used: false,
        expires_at: { [this.models.PasswordReset.sequelize.Op.gt]: new Date() },
      },
    });
  }
  // Mark an OTP as used
  async markPasswordResetUsed(id) {
    return this.models.PasswordReset.update({ used: true }, { where: { id } });
  }
}