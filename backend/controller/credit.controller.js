// Controller uses sendResponse for all API responses and logger.info/logger.error for logging
import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { hashPassword } from '../util/auth.util.js';
import { sendResponse } from '../util/response.util.js';
import { logger } from '../util/logger.util.js';
import { CreditRepository } from '../repository/credit.repository.js';
import { USER_ROLES } from '../constants.js';
import { getTenantDbModels } from './helper/tenantDb.helper.js';

export const onboardPartner = async (req, res) => {
  const {
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    creditLimit,
    userName,
    userEmail,
    userPassword,
    isApprover,
    client_id, // must be provided to link to correct tenant
    db_name // must be provided to connect to tenant DB
  } = req.body;

  if (!companyName || !contactName || !contactEmail || !contactPhone || !creditLimit || !userName || !userEmail || !userPassword || !client_id || !db_name) {
    return sendResponse(res, { success: false, error: 'Missing required fields', message: 'Onboarding failed', status: 400 });
  }

  // Always use the helper to get tenant DB context in multi-tenant architecture
  const { tenantSequelize, User, Role } = await getTenantDbModels(db_name);
  const creditRepo = new CreditRepository(tenantSequelize);

  try {
    const result = await tenantSequelize.transaction(async (t) => {
      // 1. Create CreditAccount (credit info only)
      const creditAccount = await creditRepo.createCreditAccount({
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        creditLimit
      }, t);

      // 2. Create user in master DB (role='partner', correct client_id)
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      await masterSequelize.authenticate();
      const hashedPassword = await hashPassword(userPassword);
      const masterUser = await masterRepo.createMasterUser({
        email: userEmail,
        password: hashedPassword,
        role: USER_ROLES.PARTNER,
        client_id: client_id
      });

      // 3. Create 'partner' role in tenant DB if not exists, then create user in tenant DB's User table
      let partnerRole = await Role.findOne({ where: { name: USER_ROLES.PARTNER } });
      if (!partnerRole) {
        partnerRole = await Role.create({ name: USER_ROLES.PARTNER });
      }
      const tenantUser = await User.create({
        email: userEmail,
        password: hashedPassword,
        role_id: partnerRole.id
      });

      return { creditAccount, masterUser, tenantUser };
    });

    logger.info(`[credit.controller]-[onboardPartner]: Credit partner onboarded successfully`);
    return sendResponse(res, { data: result, message: 'Credit partner onboarded successfully', status: 201 });
  } catch (err) {
    logger.error(`[credit.controller]-[onboardPartner]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Failed to onboard credit partner', status: 500 });
  }
}; 