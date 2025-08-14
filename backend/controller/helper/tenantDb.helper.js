// Helper for connecting to a tenant database and initializing models
// Usage: Call this helper in any controller that needs to access a tenant DB.
// This is required for multi-tenant architecture: always use this to get tenant DB context.

import { getTenantSequelize, tenantConnections } from '../../config/db.config.js';
import { initTenantModels } from '../../models/user.model.js';
import { initCreditModels } from '../../models/credit.model.js';
import { initStationModels } from '../../models/station.model.js';
import { initStaffShiftModels } from '../../models/staffshift.model.js';
import { initProductMasterModels } from '../../models/productMaster.model.js';

// simple in-memory cache of initialized models per dbName
const tenantModelCache = new Map();

// track one-time sync done per tenant
const tenantSyncDone = new Set();

// Helper for connecting to a tenant database and initializing models
export async function getTenantDbModels(dbName) {
  try {
    if (tenantModelCache.has(dbName)) {
      return tenantModelCache.get(dbName);
    }

    const tenantSequelize = getTenantSequelize({ dbName });
    
    // Authenticate once when establishing the connection
    await tenantSequelize.authenticate();
    
    const { User, Role, UserDetails, RefreshToken } = initTenantModels(tenantSequelize);
    const { CreditAccount, Vehicle } = initCreditModels(tenantSequelize);
    const { Booth, Nozzle} = initStationModels(tenantSequelize);
    const { Operator, Shift, ShiftAssignment } = initStaffShiftModels(tenantSequelize);
    const { ProductCategory, ProductMaster } = initProductMasterModels(tenantSequelize);

    // Optional, one-time sync for agile development
    if (process.env.DB_SYNC_ALTER === 'true' && !tenantSyncDone.has(dbName)) {
      await tenantSequelize.sync({ alter: true });
      tenantSyncDone.add(dbName);
    }

    const models = { tenantSequelize, User, Role, UserDetails, RefreshToken, CreditAccount, Vehicle, Booth, Nozzle, Operator, Shift, ShiftAssignment, ProductCategory, ProductMaster };
    tenantModelCache.set(dbName, models);
    return models;
    
  } catch (error) {
    console.error(`[tenantDb.helper]: Failed to initialize models for ${dbName}:`, error);
    // If initialization failed, ensure we do not leave a bad cache entry
    tenantModelCache.delete(dbName);
    throw error;
  }
}

// Usage example:
//   const { tenantSequelize, User, Role } = await getTenantDbModels(db_name);
//  Now use User, Role, or tenantSequelize as needed in your controller or middleware. 