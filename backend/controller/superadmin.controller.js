// Controller uses sendResponse for all API responses and logger.info/logger.error for logging
import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { sendResponse } from '../util/response.util.js';
import { logger } from '../util/logger.util.js';
// import { USER_ROLES } from '../constants.js';

// List all clients
export const listClients = async (req, res) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const clients = await masterRepo.getAllClients();
    logger.info(`[superadmin.controller]-[listClients]: Fetched all clients`);
    return sendResponse(res, { data: clients, message: 'All clients' });
  } catch (err) {
    logger.error(`[superadmin.controller]-[listClients]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Failed to fetch clients' });
  }
};

// Get client by ID
export const getClient = async (req, res) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const client = await masterRepo.getClientById(req.params.id);
    if (!client) return sendResponse(res, { success: false, error: 'Not found', message: 'Client not found', status: 404 });
    logger.info(`[superadmin.controller]-[getClient]: Fetched client ${req.params.id}`);
    return sendResponse(res, { data: client, message: 'Client details' });
  } catch (err) {
    logger.error(`[superadmin.controller]-[getClient]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Failed to fetch client' });
  }
};

// List all users
export const listUsers = async (req, res) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const users = await masterRepo.getAllMasterUsers();
    logger.info(`[superadmin.controller]-[listUsers]: Fetched all users`);
    return sendResponse(res, { data: users, message: 'All users' });
  } catch (err) {
    logger.error(`[superadmin.controller]-[listUsers]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUser = async (req, res) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const user = await masterRepo.getMasterUserById(req.params.id);
    if (!user) return sendResponse(res, { success: false, error: 'Not found', message: 'User not found', status: 404 });
    logger.info(`[superadmin.controller]-[getUser]: Fetched user ${req.params.id}`);
    return sendResponse(res, { data: user, message: 'User details' });
  } catch (err) {
    logger.error(`[superadmin.controller]-[getUser]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Failed to fetch user' });
  }
};