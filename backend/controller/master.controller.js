import { getMasterSequelize, getTenantSequelize, createDatabase } from '../config/db.config.js';
import { initTenantModels } from '../models/user.model.js';
import { hashPassword } from '../util/auth.util.js';
import { sendSuccess, sendError } from '../util/response.util.js';
import { MasterRepository } from '../repository/master.repository.js';
import dotenv from 'dotenv';
dotenv.config();

export const registerClient = async (req, res) => {
  try {
    // Only super_admin can register clients
    if (req.user.role !== 'super_admin') {
      return sendError(res, 'Forbidden', 'Only super admin can register clients', 403);
    }
    // Destructure all client metadata fields from the request body
    const {
      client_key, client_name, client_owner_name, client_address, client_city, client_state, client_country, client_pincode,
      gst_number, client_phone, client_email, client_password, db_name
    } = req.body;
    if (!client_key || !client_name || !client_owner_name || !client_email || !client_password || !db_name) {
      return sendError(res, 'Missing fields', 'Required fields missing', 400);
    }

    // 1. Create the tenant database if it doesn't exist
    await createDatabase(db_name);

    // 2. Connect to the new tenant DB using .env credentials and create tables
    const tenantSequelize = getTenantSequelize({
      dbName: db_name,
      dbUser: process.env.TENANT_DB_USER,
      dbPass: process.env.TENANT_DB_PASS,
      dbHost: process.env.TENANT_DB_HOST,
    });
    await tenantSequelize.authenticate();
    const { User: TenantUser, Role } = initTenantModels(tenantSequelize);
    await tenantSequelize.sync();

    // 3. Create default 'fuel-admin' role and user in tenant DB
    const adminRole = await Role.create({ name: 'fuel-admin' });
    const adminPassword = await hashPassword(client_password);
    const tenantAdmin = await TenantUser.create({ email: client_email, password: adminPassword, role_id: adminRole.id });

    // 4. Store client metadata in master DB using repository
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    await masterSequelize.authenticate();
    // Use client_key for uniqueness
    const existing = await masterRepo.findClientByKey(client_key);
    if (existing) return sendError(res, 'Client already exists', 'Duplicate client', 409);
    const client = await masterRepo.createClient({
      client_key, client_name, client_owner_name, client_address, client_city, client_state, client_country, client_pincode,
      gst_number, client_phone, client_email, db_name, is_active,
    });

    // 5. Also store the fuel-admin user in the master DB for centralized login/routing
    await masterRepo.createUser({
      email: client_email,
      password: adminPassword,
      role: 'fuel-admin',
      client_id: client.id
    });

    return sendSuccess(res, { client }, 'Client registered and tenant DB initialized');
  } catch (err) {
    console.error('Client registration error:', err);
    return sendError(res, err, 'Client registration error');
  }
};