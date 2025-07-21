// Controller uses sendResponse for all API responses and logger.info/logger.error for logging
import { getMasterSequelize, createDatabase } from '../config/db.config.js';
import { hashPassword } from '../util/auth.util.js';
import { sendResponse } from '../util/response.util.js';
import { MasterRepository } from '../repository/master.repository.js';
import { logger } from '../util/logger.util.js';
import dotenv from 'dotenv';
import { USER_ROLES } from '../constants.js';
import { getTenantDbModels } from './helper/tenantDb.helper.js';
dotenv.config();

export const registerClient = async (req, res) => {
  try {
    // Only super_admin can register clients
    if (req.user.role !== 'super_admin') {
      return sendResponse(res, { success: false, error: 'Forbidden', message: 'Only super admin can register clients', status: 403 });
    }
    // Destructure all client metadata fields from the request body
    const {
      client_key, client_name, client_owner_name, client_address, client_city, client_state, client_country, client_pincode,
      gst_number, client_phone, client_email, client_password, db_name
    } = req.body;
    if (!client_key || !client_name || !client_owner_name || !client_email || !client_password || !db_name) {
      return sendResponse(res, { success: false, error: 'Missing fields', message: 'Required fields missing', status: 400 });
    }

    // 1. Create the tenant database if it doesn't exist
    await createDatabase(db_name);

    // Always use the helper to get tenant DB context in multi-tenant architecture
    const { tenantSequelize, User: TenantUser, Role } = await getTenantDbModels(db_name);

    // 3. Create default 'fuel-admin' role and user in tenant DB
    const adminRole = await Role.create({ name: USER_ROLES.FUEL_ADMIN });
    const adminPassword = await hashPassword(client_password);
    const tenantAdmin = await TenantUser.create({ email: client_email, password: adminPassword, role_id: adminRole.id });

    // 4. Store client metadata in master DB using repository
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    await masterSequelize.authenticate();
    // Use client_key for uniqueness
    const existing = await masterRepo.findClientByKey(client_key);
    if (existing) return sendResponse(res, { success: false, error: 'Client already exists', message: 'Duplicate client', status: 409 });
    
    const client = await masterRepo.createClient({
      client_key, client_name, client_owner_name, client_address, client_city, client_state, client_country, client_pincode,
      gst_number, client_phone, client_email, db_name,
    });

    // 5. Also store the fuel-admin user in the master DB for centralized login/routing
    await masterRepo.createMasterUser({
      email: client_email,
      password: adminPassword,
      role: USER_ROLES.FUEL_ADMIN,
      client_id: client.id
    });

    logger.info(`[master.controller]-[registerClient]: Client ${client_name} registered and tenant DB initialized`);
    return sendResponse(res, { data: { client }, message: 'Client registered and tenant DB initialized' });
  } catch (err) {
    logger.error(`[master.controller]-[registerClient]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Client registration error' });
  }
};