// Helper for connecting to a tenant database and initializing models
// Usage: Call this helper in any controller that needs to access a tenant DB.
// This is required for multi-tenant architecture: always use this to get tenant DB context.
import { getTenantSequelize } from '../../config/db.config.js';
import { initTenantModels } from '../../models/user.model.js';

/**
 * Get tenant DB context (connection and initialized models)
 * @param {string} db_name - The tenant database name
 * @returns {Promise<{tenantSequelize, User, Role}>}
 */
export async function getTenantDbModels(db_name) {
  const tenantSequelize = getTenantSequelize({
    dbName: db_name,
    dbUser: process.env.TENANT_DB_USER,
    dbPass: process.env.TENANT_DB_PASS,
    dbHost: process.env.TENANT_DB_HOST,
  });
  await tenantSequelize.authenticate();
  await tenantSequelize.sync();
  const { User, Role } = initTenantModels(tenantSequelize);
  return { tenantSequelize, User, Role };
}

// Usage example:
//   const { tenantSequelize, User, Role } = await getTenantDbModels(db_name);
//   // Now use User, Role, or tenantSequelize as needed in your controller or middleware. 