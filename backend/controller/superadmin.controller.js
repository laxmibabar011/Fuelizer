import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { getTenantDbModels } from './helper/tenantDb.helper.js';
import { sendResponse } from '../util/response.util.js';
import { logger } from '../util/logger.util.js';

export default class SuperAdminController {
  static async listClients(req, res) {
    try {
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      const clients = await masterRepo.findAllClients();
      logger.info(`[SuperAdminController]-[listClients]: Fetched all clients`);
      return sendResponse(res, { data: clients, message: 'All clients' });
    } catch (err) {
      logger.error(`[SuperAdminController]-[listClients]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch clients' });
    }
  }

  static async getClient(req, res) {
    try {
      const { id } = req.params;
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      const client = await masterRepo.findClientById(id);
      if (!client) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Client not found', status: 404 });
      }
      logger.info(`[SuperAdminController]-[getClient]: Fetched client ${id}`);
      return sendResponse(res, { data: client, message: 'Client details' });
    } catch (err) {
      logger.error(`[SuperAdminController]-[getClient]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch client' });
    }
  }

  static async listUsers(req, res) {
    try {
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      const superAdmins = await masterRepo.getAllSuperAdminUsers();
      const clients = await masterRepo.findAllClients();

      const tenantUsers = [];
      for (const client of clients) {
        if (client.is_active) {
          const { User, Role, UserDetails } = await getTenantDbModels(client.db_name);
          const users = await User.findAll({ include: ['Role', 'UserDetails'] });
          tenantUsers.push(
            ...users.map(user => ({
              user_id: user.user_id,
              email: user.email,
              role: user.Role?.name || null,
              client_id: client.client_id,
              details: user.UserDetails || {}
            }))
          );
        }
      }

      const allUsers = [
        ...superAdmins.map(user => ({
          user_id: user.id,
          email: user.email,
          role: user.role,
          client_id: null
        })),
        ...tenantUsers
      ];

      logger.info(`[SuperAdminController]-[listUsers]: Fetched all users`);
      return sendResponse(res, { data: allUsers, message: 'All users' });
    } catch (err) {
      logger.error(`[SuperAdminController]-[listUsers]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch users' });
    }
  }

  static async getUser(req, res) {
    try {
      const { id } = req.params;
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);

      // First, check if user is a super-admin in master_db
      let user = await masterRepo.getSuperAdminUserById(id);
      if (user) {
        return sendResponse(res, {
          data: { user_id: user.id, email: user.email, role: user.role, client_id: null },
          message: 'User details'
        });
      }

      // If not super-admin, check tenant databases
      const clients = await masterRepo.findAllClients();
      for (const client of clients) {
        if (client.is_active) {
          const { User, Role, UserDetails } = await getTenantDbModels(client.db_name);
          user = await User.findOne({ where: { user_id: id }, include: ['Role', 'UserDetails'] });
          if (user) {
            return sendResponse(res, {
              data: {
                user_id: user.user_id,
                email: user.email,
                role: user.Role?.name || null,
                client_id: client.client_id,
                details: user.UserDetails || {}
              },
              message: 'User details'
            });
          }
        }
      }

      return sendResponse(res, { success: false, error: 'Not found', message: 'User not found', status: 404 });
    } catch (err) {
      logger.error(`[SuperAdminController]-[getUser]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch user' });
    }
  }
}