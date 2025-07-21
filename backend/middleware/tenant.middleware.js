import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import dotenv from 'dotenv';
dotenv.config();
import { getTenantDbModels } from '../controller/helper/tenantDb.helper.js';

export const tenantDbMiddleware = async (req, res, next) => {
  try {
    // client_id should be present on req.user from authentication middleware
    const clientId = req.user && req.user.client_id;
    if (!clientId) {
      return res.status(400).json({ message: 'No client_id found in user context' });
    }
    // Connect to master DB and get client info
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const client = await masterRepo.getClientById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    const dbName = client.db_name;
    // Use the helper to get tenant DB context (multi-tenant practice)
    const { tenantSequelize, User, Role } = await getTenantDbModels(dbName);
    req.tenantSequelize = tenantSequelize;
    req.tenantModels = { User, Role };
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error resolving tenant DB', error: err.message });
  }
};