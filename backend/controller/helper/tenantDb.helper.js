// backend/controller/helper/tenantDb.helper.js

import { getTenantSequelize } from '../../config/db.config.js';
import { initTenantModels } from '../../models/user.model.js';
import { initCreditModels } from '../../models/credit.model.js';
import { initStationModels } from '../../models/station.model.js';
import { initStaffShiftModels } from '../../models/staffshift.model.js';
// <-- CHANGED: Import the new product model initializer
import { initProductModels } from '../../models/product.model.js';
import { initOperationModels } from '../../models/operations.model.js';
import { initMeterReadingModel } from '../../models/meterReading.model.js';
import { initTransactionModels } from '../../models/transaction.model.js';
import { initDecantationLogsModels } from '../../models/decantationLogs.model.js';
import { initPurchaseModels } from '../../models/purchase.model.js';
import { initSalesModels } from '../../models/sales.model.js';
import { initLedgerModels } from '../../models/ledger.model.js';
import { setupAssociations } from '../../models/associations.js';

const tenantModelCache = new Map();
const tenantSyncDone = new Set();

export async function getTenantDbModels(dbName) {
  try {
    if (tenantModelCache.has(dbName)) {
      return tenantModelCache.get(dbName);
    }

    const tenantSequelize = getTenantSequelize({ dbName });
    await tenantSequelize.authenticate();
    
    // Initialize models
    const { User, Role, UserDetails, RefreshToken, OperatorGroup } = initTenantModels(tenantSequelize);
    const { CreditAccount, Vehicle } = initCreditModels(tenantSequelize);
    // Initialize Product models BEFORE station to ensure associations
    const { Product, ProductCategory, UnitOfMeasure, InventoryLevel } = initProductModels(tenantSequelize);
    const { Booth, Nozzle} = initStationModels(tenantSequelize);
    const { Operator, Shift, ShiftAssignment, OperatorGroupBooth, OperatorGroupMember } = initStaffShiftModels(tenantSequelize);

    const { OperationalDay, ShiftLedger } = initOperationModels(tenantSequelize);
    const { MeterReading } = initMeterReadingModel(tenantSequelize);
    const { Transaction, PaymentMethod } = initTransactionModels(tenantSequelize);
    const { DecantationTable, DecantationEntry } = initDecantationLogsModels(tenantSequelize);

    const { Vendor, Purchase, PurchaseItem } = initPurchaseModels(tenantSequelize);
    const { Sales } = initSalesModels(tenantSequelize);
    const { LedgerAccount, JournalVoucher, JournalEntry } = initLedgerModels(tenantSequelize);

    // Set up cross-model associations after all models are initialized
    setupAssociations({
      User, Role, UserDetails, RefreshToken, OperatorGroup,
      CreditAccount, Vehicle,
      Booth, Nozzle,
      Operator, Shift, ShiftAssignment, OperatorGroupBooth, OperatorGroupMember,
      Product, ProductCategory, UnitOfMeasure, InventoryLevel,
      OperationalDay, ShiftLedger,
      MeterReading,
      Transaction, PaymentMethod,
      DecantationTable, DecantationEntry,
      Vendor, Purchase, PurchaseItem,
      Sales,
      LedgerAccount, JournalVoucher, JournalEntry
    });

    if (process.env.DB_SYNC_ALTER === 'true' && !tenantSyncDone.has(dbName)) {
      await tenantSequelize.sync({ alter: true });
      console.log(`[tenantDb.helper]: Database sync completed for ${dbName}`);
      tenantSyncDone.add(dbName);
    }

    const models = { 
      tenantSequelize, 
      User, Role, UserDetails, RefreshToken, OperatorGroup, 
      CreditAccount, Vehicle, 
      Booth, Nozzle, 
      Operator, Shift, ShiftAssignment, OperatorGroupBooth, OperatorGroupMember, 
      
      // <-- ADDED: Expose all new models
      Product,
      ProductCategory,
      UnitOfMeasure,
      InventoryLevel,
      
      OperationalDay, ShiftLedger,
      MeterReading,
      Transaction, PaymentMethod,
      DecantationTable, DecantationEntry,
      Vendor, Purchase, PurchaseItem,
      Sales,
      
      // General Ledger models
      LedgerAccount,
      JournalVoucher,
      JournalEntry
    };

    tenantModelCache.set(dbName, models);
    return models;
    
  } catch (error) {
    console.error(`[tenantDb.helper]: Failed to initialize models for ${dbName}:`, error);
    tenantModelCache.delete(dbName);
    throw error;
  }
}