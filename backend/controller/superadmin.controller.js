import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { sendSuccess, sendError } from '../util/response.util.js';

// List all clients
export const listClients = async (req, res) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const clients = await masterRepo.getAllClients();
    return sendSuccess(res, clients, 'All clients');
  } catch (err) {
    return sendError(res, err, 'Failed to fetch clients');
  }
};

// Get client by ID
export const getClient = async (req, res) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const client = await masterRepo.getClientById(req.params.id);
    if (!client) return sendError(res, 'Not found', 'Client not found', 404);
    return sendSuccess(res, client, 'Client details');
  } catch (err) {
    return sendError(res, err, 'Failed to fetch client');
  }
};

// List all users
export const listUsers = async (req, res) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const users = await masterRepo.getAllUsers();
    return sendSuccess(res, users, 'All users');
  } catch (err) {
    return sendError(res, err, 'Failed to fetch users');
  }
};

// Get user by ID
export const getUser = async (req, res) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const user = await masterRepo.getUserById(req.params.id);
    if (!user) return sendError(res, 'Not found', 'User not found', 404);
    return sendSuccess(res, user, 'User details');
  } catch (err) {
    return sendError(res, err, 'Failed to fetch user');
  }
};