import { getMasterSequelize, getTenantSequelize } from '../config/db.config.js';
import { initMasterModels } from '../models/master.model.js';
import { initTenantModels } from '../models/user.model.js';

/**
 * Middleware to attach the correct tenant DB instance to req
 * based on client_id in the JWT (req.user).
 */
export const tenantDbMiddleware = async (req, res, next) => {
  try {
    const { client_id } = req.user;
    if (!client_id) return res.status(400).json({ message: 'No client_id in token' });

    // Get master DB connection and models
    const masterSequelize = getMasterSequelize();
    const { Client } = initMasterModels(masterSequelize);
    await masterSequelize.authenticate();

    // Find client DB info by client_id
    const client = await Client.findByPk(client_id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Create tenant DB connection using info from master DB
    const tenantSequelize = getTenantSequelize({
      dbName: client.db_name,
      dbUser: process.env.TENANT_DB_USER,
      dbPass: process.env.TENANT_DB_PASS,
      dbHost: process.env.TENANT_DB_HOST,
    });
    await tenantSequelize.authenticate();
    req.tenantDb = tenantSequelize;
    req.tenantModels = initTenantModels(tenantSequelize);
    req.client = client; // Attach client metadata if needed
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Tenant DB error', error: err.message });
  }
};