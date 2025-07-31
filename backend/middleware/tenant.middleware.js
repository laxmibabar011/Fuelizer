import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { getTenantDbModels } from '../controller/helper/tenantDb.helper.js';

// Middleware to resolve tenant database for non-super-admin users
export const tenantDbMiddleware = async (req, res, next) => {
  try {
    const clientId = req.user?.clientId; // Use clientId from JWT
    if (!clientId) {
      // Skip tenant DB resolution for super-admin
      if (req.user?.role === 'super_admin') {
        return next();
      }
      return res.status(400).json({ success: false, message: 'No clientId found in user context' });
    }

    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const client = await masterRepo.findClientById(clientId);
    if (!client || !client.is_active) {
      return res.status(404).json({ success: false, message: 'Client not found or inactive' });
    }

    const { tenantSequelize, User, Role, UserDetails, RefreshToken } = await getTenantDbModels(client.db_name);
    req.tenantSequelize = tenantSequelize;
    req.tenantModels = { User, Role, UserDetails, RefreshToken };
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error resolving tenant DB', error: err.message });
  }
};