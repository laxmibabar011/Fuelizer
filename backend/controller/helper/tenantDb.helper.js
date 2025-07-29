// Helper for connecting to a tenant database and initializing models
// Usage: Call this helper in any controller that needs to access a tenant DB.
// This is required for multi-tenant architecture: always use this to get tenant DB context.

import { getTenantSequelize } from '../../config/db.config.js';
import { initTenantModels } from '../../models/user.model.js';

// Helper for connecting to a tenant database and initializing models
export async function getTenantDbModels(dbName) {
  const tenantSequelize = getTenantSequelize({ dbName });
  await tenantSequelize.authenticate();
  const { User, Role, UserDetails, RefreshToken } = initTenantModels(tenantSequelize);
  await tenantSequelize.sync({ alter: true });
  return { tenantSequelize, User, Role, UserDetails, RefreshToken };
}

// Usage example:
//   const { tenantSequelize, User, Role } = await getTenantDbModels(db_name);
//  Now use User, Role, or tenantSequelize as needed in your controller or middleware. 