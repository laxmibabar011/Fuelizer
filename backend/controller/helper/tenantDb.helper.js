// Helper for connecting to a tenant database and initializing models
// Usage: Call this helper in any controller that needs to access a tenant DB.
// This is required for multi-tenant architecture: always use this to get tenant DB context.

import { getTenantSequelize, tenantConnections } from '../../config/db.config.js';
import { initTenantModels } from '../../models/user.model.js';
import { initCreditModels } from '../../models/credit.model.js';
import { initStationModels } from '../../models/station.model.js';
import { initStaffShiftModels } from '../../models/staffshift.model.js';
import { initProductMasterModels } from '../../models/productMaster.model.js';
import { initOperationModels } from '../../models/operations.model.js';
import { initMeterReadingModel } from '../../models/meterReading.model.js';
import { initTransactionModels } from '../../models/transaction.model.js';
import { setupAssociations } from '../../models/associations.js';

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
    
    // Initialize models in correct order to avoid foreign key issues
    const { User, Role, UserDetails, RefreshToken, OperatorGroup } = initTenantModels(tenantSequelize);
    const { CreditAccount, Vehicle } = initCreditModels(tenantSequelize);
    const { Booth, Nozzle} = initStationModels(tenantSequelize);
    const { Operator, Shift, ShiftAssignment, OperatorGroupBooth, OperatorGroupMember } = initStaffShiftModels(tenantSequelize);
    const { ProductCategory, ProductMaster } = initProductMasterModels(tenantSequelize);
    const { OperationalDay, ShiftLedger } = initOperationModels(tenantSequelize);
    const { MeterReading } = initMeterReadingModel(tenantSequelize);
    const { Transaction, PaymentMethod } = initTransactionModels(tenantSequelize);

    // Set up cross-model associations after all models are initialized
    setupAssociations({
      User,
      UserDetails,
      OperatorGroup,
      Shift,
      OperatorGroupMember,
      OperatorGroupBooth,
      Booth,
      Operator,
      ShiftAssignment,
      MeterReading,
      ShiftLedger,
      Nozzle
    });

    // Optional, one-time sync for agile development
    if (process.env.DB_SYNC_ALTER === 'true' && !tenantSyncDone.has(dbName)) {
      try {
        await tenantSequelize.sync({ alter: true });
        console.log(`[tenantDb.helper]: Database sync completed for ${dbName}`);
      } catch (syncError) {
        console.error(`[tenantDb.helper]: Database sync failed for ${dbName}:`, syncError);
        // Continue without sync for now
      }
      tenantSyncDone.add(dbName);
    }

    const models = { 
      tenantSequelize, 
      User, Role, UserDetails, RefreshToken, OperatorGroup, 
      CreditAccount, Vehicle, 
      Booth, Nozzle, 
      Operator, Shift, ShiftAssignment, OperatorGroupBooth, OperatorGroupMember, 
      ProductCategory, ProductMaster,
      OperationalDay, ShiftLedger,
      MeterReading,
      Transaction, PaymentMethod
    };
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