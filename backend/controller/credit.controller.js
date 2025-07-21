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

    return sendSuccess(res, result, 'Credit partner onboarded successfully', 201);
  } catch (err) {
    console.error('Credit onboarding error:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    
    // Check for specific validation errors
    if (err.name === 'SequelizeValidationError') {
      const validationErrors = err.errors.map(e => `${e.path}: ${e.message}`).join(', ');
      return sendError(res, `Validation errors: ${validationErrors}`, 'Validation failed', 400);
    }
    
    if (err.name === 'SequelizeUniqueConstraintError') {
      const uniqueErrors = err.errors.map(e => `${e.path}: already exists`).join(', ');
      return sendError(res, `Duplicate data: ${uniqueErrors}`, 'Duplicate entry', 409);
    }
    
    return sendError(res, err.message || 'Database error', 'Failed to onboard credit partner', 500);
  }
}; 

export const updatePartnerStatus = async (req, res) => {
  const tenantSequelize = req.tenantSequelize;
  const { id } = req.params;
  const { status } = req.body;
  if (!['Active', 'Suspended', 'Inactive'].includes(status)) {
    return sendError(res, 'Invalid status', 'Status must be Active, Suspended, or Inactive', 400);
  }
  try {
    const creditRepo = new CreditRepository(tenantSequelize);
    const partner = await creditRepo.getCreditCustomerById(id);
    if (!partner) {
      return sendError(res, 'Partner not found', 'Not found', 404);
    }
    partner.status = status;
    await partner.save();
    return sendSuccess(res, partner, `Partner status updated to ${status}`);
  } catch (err) {
    return sendError(res, err, 'Failed to update partner status', 500);
  }
}; 