import { getMasterSequelize, createDatabase } from '../config/db.config.js';
import { hashPassword } from '../util/auth.util.js';
import { sendResponse } from '../util/response.util.js';
import { MasterRepository } from '../repository/master.repository.js';
import { UserRepository } from '../repository/user.repository.js';
import { logger } from '../util/logger.util.js';
import { getTenantDbModels } from './helper/tenantDb.helper.js';
import dotenv from 'dotenv';
dotenv.config();

export default class MasterController {
  static async registerClient(req, res) {
    try {
      if (req.user.role !== 'super_admin') {
        return sendResponse(res, { success: false, error: 'Forbidden', message: 'Only super-admin can register clients', status: 403 });
      }

      const {
        client_id, client_name, client_owner_name, client_address, client_city, client_state, client_country, client_pincode,
        gst_number, client_phone, client_email, client_password, db_name
      } = req.body;

      if (!client_id || !client_name || !client_owner_name || !client_email || !client_password || !db_name) {
        return sendResponse(res, { success: false, error: 'Missing fields', message: 'Required fields missing', status: 400 });
      }

      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      const existing = await masterRepo.findClientById(client_id);
      if (existing) {
        return sendResponse(res, { success: false, error: 'Client already exists', message: 'Duplicate client', status: 409 });
      }

      await createDatabase(db_name);
      const { tenantSequelize, User: TenantUser, Role, UserDetails } = await getTenantDbModels(db_name);
      const userRepo = new UserRepository(tenantSequelize);

      const adminRole = await userRepo.createRole({ name: 'fuel-admin' });
      const adminPassword = await hashPassword(client_password);
      const tenantAdmin = await userRepo.createTenantUser({
        user_id: `user_${Date.now()}`,
        email: client_email,
        password_hash: adminPassword,
        role_id: adminRole.id
      });

      await userRepo.createUserDetails({
        user_id: tenantAdmin.user_id,
        full_name: client_owner_name,
        email: client_email,
        phone: client_phone,
        city: client_city,
        state: client_state,
        country: client_country,
        postal_code: client_pincode,
        gstin: gst_number
      });

      const client = await masterRepo.createClient({
        client_id,
        client_name,
        client_owner_name,
        client_address,
        client_city,
        client_state,
        client_country,
        client_pincode,
        gst_number,
        client_phone,
        client_email,
        db_name
      });

      logger.info(`[MasterController]-[registerClient]: Client ${client_name} registered and tenant DB initialized`);
      return sendResponse(res, { data: { client }, message: 'Client registered and tenant DB initialized' });
    } catch (err) {
      logger.error(`[MasterController]-[registerClient]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Client registration error' });
    }
  }
}