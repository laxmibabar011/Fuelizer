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
  async createUser(userData) {
    return this.models.User.create(userData);
  }

  // Find a user by email (email)
  async findUserByEmail(email) {
    return this.models.User.findOne({ where: { email } });
  }
  async getAllClients() {
    return this.models.Client.findAll();
  }
  
  // Get client by ID
  async getClientById(id) {
    return this.models.Client.findByPk(id);
  }
  
  // List all users (across all clients)
  async getAllUsers() {
    return this.models.User.findAll();
  }
  
  // Get user by ID
  async getUserById(id) {
    return this.models.User.findByPk(id);
  }

  // Update a user's access_token by user ID
  async updateUserAccessToken(userId, accessToken) {
    return this.models.User.update(
      { access_token: accessToken },
      { where: { id: userId } }
    );
  }
}