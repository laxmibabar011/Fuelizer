// Helper for connecting to a tenant database and initializing models
// Usage: Call this helper in any controller that needs to access a tenant DB.
// This is required for multi-tenant architecture: always use this to get tenant DB context.

import { getTenantSequelize, tenantConnections } from '../../config/db.config.js';
import { initTenantModels } from '../../models/user.model.js';
import { initCreditModels } from '../../models/credit.model.js';
import { initStationModels } from '../../models/station.model.js';

// Helper for connecting to a tenant database and initializing models
export async function getTenantDbModels(dbName) {
  try {
    const tenantSequelize = getTenantSequelize({ dbName });
    
    // Test connection and reconnect if needed
    try {
      await tenantSequelize.authenticate();
    } catch (authErr) {
      console.log(`[tenantDb.helper]: Connection failed for ${dbName}, attempting reconnect...`);
      // Force new connection by clearing from cache
      tenantConnections.delete(dbName);
      const newSequelize = getTenantSequelize({ dbName });
      await newSequelize.authenticate();
    }
    
    const { User, Role, UserDetails, RefreshToken } = initTenantModels(tenantSequelize);
    const { CreditAccount, Vehicle } = initCreditModels(tenantSequelize);
    const { Booth, Nozzle, Product } = initStationModels(tenantSequelize);
    
    // Sync with alter true for development - auto-updates schema
    try {
      await tenantSequelize.sync({ alter: true });
    } catch (syncErr) {
      console.warn(`[tenantDb.helper]: Sync warning for ${dbName}: ${syncErr.message}`);
    }

    //return the models
    
    return { tenantSequelize, User, Role, UserDetails, RefreshToken, CreditAccount, Vehicle, Booth, Nozzle, Product };
    
  } catch (error) {
    console.error(`[tenantDb.helper]: Failed to initialize models for ${dbName}:`, error);
    throw error;
  }
}

// Usage example:
//   const { tenantSequelize, User, Role } = await getTenantDbModels(db_name);
//  Now use User, Role, or tenantSequelize as needed in your controller or middleware. 