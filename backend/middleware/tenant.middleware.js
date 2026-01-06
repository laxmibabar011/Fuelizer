// backend/middleware/tenant.middleware.js

import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { getTenantDbModels } from '../controller/helper/tenantDb.helper.js';

export const tenantDbMiddleware = async (req, res, next) => {
    try {
        const bunkId = req.user?.bunkId;
        if (!bunkId) {
            if (req.user?.role === 'super_admin') {
                return next();
            }
            return res.status(400).json({ success: false, message: 'No bunkId found in user context' });
        }

        const masterSequelize = getMasterSequelize();
        const masterRepo = new MasterRepository(masterSequelize);
        const client = await masterRepo.findClientById(bunkId);
        if (!client || !client.is_active) {
            return res.status(404).json({ success: false, message: 'Client not found or inactive' });
        }

        // <-- CHANGED: Simplified logic
        const tenantModels = await getTenantDbModels(client.db_name);
        
        // Attach the sequelize instance and all models to the request object
        req.tenantSequelize = tenantModels.tenantSequelize;
        req.tenantModels = tenantModels; // Attach the entire models object

        next();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error resolving tenant DB', error: err.message });
    }
};