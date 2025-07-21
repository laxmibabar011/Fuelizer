import { getMasterSequelize, getTenantSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { initCreditModels } from '../models/credit.model.js';
import dotenv from 'dotenv';
dotenv.config();

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
    // Create tenant Sequelize instance
    const tenantSequelize = getTenantSequelize({
      dbName,
      dbUser: process.env.TENANT_DB_USER,
      dbPass: process.env.TENANT_DB_PASS,
      dbHost: process.env.TENANT_DB_HOST,
    });

    // // Initialize credit models for the tenant DB
    // initCreditModels(tenantSequelize);
    // // sync models for the tenant DB--DB sync is required for the tenant DB
    // await tenantSequelize.sync({ alter: true });

    req.tenantSequelize = tenantSequelize;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error resolving tenant DB', error: err.message });
  }
};