// Controller uses sendResponse for all API responses and logger.info/logger.error for logging
import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { hashPassword } from '../util/auth.util.js';
import { sendResponse } from '../util/response.util.js';
import { logger } from '../util/logger.util.js';
import { CreditRepository } from '../repository/credit.repository.js';
import { USER_ROLES } from '../constants.js';
import { getTenantDbModels } from './helper/tenantDb.helper.js';
import { initCreditModels } from '../models/credit.model.js';

// Helper to get tenant context from req.user.client_id
// 1. Fetch client_id from authenticated user
// 2. Get client info and db_name from master DB
// 3. Get tenant DB connection and initialize User/Role models
// 4. Initialize and sync CreditAccount model (ensures table exists)
async function getTenantContextFromUser(req) {
  if (!req.user || !req.user.client_id) {
    throw new Error('Unauthorized: No user context');
  }
  const client_id = req.user.client_id;
  // Connect to master DB and get client info
  const masterSequelize = getMasterSequelize();
  const masterRepo = new MasterRepository(masterSequelize);
  await masterSequelize.authenticate();
  const client = await masterRepo.getClientById(client_id);
  if (!client || !client.db_name) {
    throw new Error('Invalid client_id');
  }
  const db_name = client.db_name;
  // Get tenant DB context (User, Role, UserDetails models)
  const { tenantSequelize, User, Role, UserDetails } = await getTenantDbModels(db_name);
  // Initialize and sync CreditAccount model for credit management
  const { CreditAccount } = initCreditModels(tenantSequelize);
  await tenantSequelize.sync({ alter: true });
  return { tenantSequelize, User, Role, CreditAccount, UserDetails };
}

// Onboard a new credit partner (company + user)
// 1. Validate required fields
// 2. Get tenant context (DB connection, models)
// 3. Create credit account in tenant DB
// 4. Create user in master DB (role: partner)
// 5. Create user in tenant DB (role: partner)
export const onboardPartner = async (req, res) => {
  try {
    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      creditLimit,
      userName,
      userEmail,
      userPassword
    } = req.body;

    // Step 1: Validate required fields
    if (!companyName || !contactName || !contactEmail || !contactPhone || !creditLimit || !userName || !userEmail || !userPassword) {
      return sendResponse(res, { success: false, error: 'Missing required fields', message: 'Onboarding failed', status: 400 });
    }

    // Step 2: Get tenant context (DB connection, models)
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Onboarding failed', status: 401 });
    }
    const { tenantSequelize, User, Role, CreditAccount, UserDetails } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    await masterSequelize.authenticate();
    const client_id = req.user.client_id;

    // Step 3: Create credit account and users in a transaction
    const result = await tenantSequelize.transaction(async (t) => {
      // 3.1 Create CreditAccount (credit info only)
      const creditAccount = await creditRepo.createCreditAccount({
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        creditLimit
      }, t);

      // 3.2 Create user in master DB (role='partner', correct client_id)
      const hashedPassword = await hashPassword(userPassword);
      const masterUser = await masterRepo.createMasterUser({
        email: userEmail,
        password: hashedPassword,
        role: USER_ROLES.PARTNER,
        client_id: client_id
      });

      // 3.3 Create 'partner' role in tenant DB if not exists, then create user in tenant DB's User table
      let partnerRole = await Role.findOne({ where: { name: USER_ROLES.PARTNER } });
      if (!partnerRole) {
        partnerRole = await Role.create({ name: USER_ROLES.PARTNER });
      }
      const tenantUser = await User.create({
        email: userEmail,
        password: hashedPassword,
        role_id: partnerRole.id
      });

      // Populate user_details for partner in tenant DB
      await UserDetails.create({
        user_id: tenantUser.id,
        full_name: contactName,
        email: contactEmail,
        phone: contactPhone,
        city: req.body.city || null,
        state: req.body.state || null,
        country: req.body.country || null,
        postal_code: req.body.postal_code || null,
        gstin: req.body.gstin || null,
      });

      return { creditAccount, masterUser, tenantUser };
    });

    logger.info(`[credit.controller]-[onboardPartner]: Credit partner onboarded successfully`);
    return sendResponse(res, { data: result, message: 'Credit partner onboarded successfully', status: 201 });
  } catch (err) {
    logger.error(`[credit.controller]-[onboardPartner]:`, err);
    return sendResponse(res, { success: false, error: err.errors ? err.errors.map(e => e.message).join(', ') : err.message, message: 'Failed to onboard credit partner', status: 500 });
  }
};

// Get a credit partner by ID (from tenant DB)
export const getCreditPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    // Get tenant context
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch credit partner details', status: 401 });
    }
    const { tenantSequelize } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const partner = await creditRepo.getCreditAccountById(id);
    if (!partner) {
      return sendResponse(res, { success: false, error: 'Partner not found', message: 'Not found', status: 404 });
    }
    return sendResponse(res, { data: partner, message: 'Credit partner details fetched successfully', status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[getCreditPartnerById]: Error fetching partner ID ${req.params.id}`);
    logger.error(err); // This will log the full error object, including stack trace
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch credit partner details', status: 500 });
  }
};

// Update a credit partner's status (Active/Suspended/Inactive)
export const updatePartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Active', 'Suspended', 'Inactive'].includes(status)) {
      return sendResponse(res, { success: false, error: 'Invalid status', message: 'Status must be Active, Suspended, or Inactive', status: 400 });
    }
    // Get tenant context
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update partner status', status: 401 });
    }
    const { tenantSequelize } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const partner = await creditRepo.getCreditAccountById(id);
    if (!partner) {
      return sendResponse(res, { success: false, error: 'Partner not found', message: 'Not found', status: 404 });
    }
    partner.status = status;
    await partner.save();
    return sendResponse(res, { data: partner, message: `Partner status updated to ${status}`, status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[updatePartnerStatus]: ${err.message}`);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to update partner status', status: 500 });
  }
};

// List all credit partners (from tenant DB)
export const listCreditPartners = async (req, res) => {
  try {
    // Get tenant context
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch credit partners', status: 401 });
    }
    const { tenantSequelize } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const partners = await creditRepo.getAllCreditAccounts();
    return sendResponse(res, { data: partners, message: 'Credit partners fetched successfully', status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[listCreditPartners]: ${err.message}`);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch credit partners', status: 500 });
  }
};

// List vehicles for a partner
export const getVehiclesByPartnerId = async (req, res) => {
  try {
    const { partnerId } = req.params;
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch vehicles', status: 401 });
    }
    const { tenantSequelize } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const vehicles = await creditRepo.getVehiclesByPartnerId(partnerId);
    return sendResponse(res, { data: vehicles, message: 'Vehicles fetched successfully', status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[getVehiclesByPartnerId]: ${err.message}`);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch vehicles', status: 500 });
  }
};

// Add vehicles for a partner (bulk)
export const addVehicles = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { vehicles } = req.body;
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return sendResponse(res, { success: false, error: 'No vehicles provided', message: 'No vehicles provided', status: 400 });
    }
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to add vehicles', status: 401 });
    }
    const { tenantSequelize } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const created = await creditRepo.addVehicles(partnerId, vehicles);
    return sendResponse(res, { data: created, message: 'Vehicles added successfully', status: 201 });
  } catch (err) {
    logger.error(`[credit.controller]-[addVehicles]: ${err.message}`);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to add vehicles', status: 500 });
  }
};

// Update a vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const data = req.body;
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update vehicle', status: 401 });
    }
    const { tenantSequelize } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const updated = await creditRepo.updateVehicle(vehicleId, data);
    if (!updated) {
      return sendResponse(res, { success: false, error: 'Vehicle not found', message: 'Vehicle not found', status: 404 });
    }
    return sendResponse(res, { data: updated, message: 'Vehicle updated successfully', status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[updateVehicle]: ${err.message}`);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to update vehicle', status: 500 });
  }
};

// Set vehicle status
export const setVehicleStatus = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
      return sendResponse(res, { success: false, error: 'Invalid status', message: 'Status must be Active or Inactive', status: 400 });
    }
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update vehicle status', status: 401 });
    }
    const { tenantSequelize } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const updated = await creditRepo.setVehicleStatus(vehicleId, status);
    if (!updated) {
      return sendResponse(res, { success: false, error: 'Vehicle not found', message: 'Vehicle not found', status: 404 });
    }
    return sendResponse(res, { data: updated, message: `Vehicle status updated to ${status}`, status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[setVehicleStatus]: ${err.message}`);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to update vehicle status', status: 500 });
  }
};

// Delete a vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete vehicle', status: 401 });
    }
    const { tenantSequelize } = tenantContext;
    const creditRepo = new CreditRepository(tenantSequelize);
    const deleted = await creditRepo.deleteVehicle(vehicleId);
    if (!deleted) {
      return sendResponse(res, { success: false, error: 'Vehicle not found', message: 'Vehicle not found', status: 404 });
    }
    return sendResponse(res, { data: {}, message: 'Vehicle deleted successfully', status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[deleteVehicle]: ${err.message}`);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete vehicle', status: 500 });
  }
};

// Fetch user details by user_id from tenant DB
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch user details', status: 401 });
    }
    const { UserDetails } = tenantContext;
    const details = await UserDetails.findOne({ where: { user_id: userId } });
    if (!details) {
      return sendResponse(res, { success: false, message: 'User details not found', status: 404 });
    }
    return sendResponse(res, { data: details, message: 'User details fetched successfully', status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[getUserDetails]:`, err);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch user details', status: 500 });
  }
};

// Fetch user details by email from tenant DB
export const getUserDetailsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    let tenantContext;
    try {
      tenantContext = await getTenantContextFromUser(req);
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch user details', status: 401 });
    }
    const { User, UserDetails } = tenantContext;
    const tenantUser = await User.findOne({ where: { email } });
    if (!tenantUser) {
      return sendResponse(res, { success: false, message: 'User not found', status: 404 });
    }
    const details = await UserDetails.findOne({ where: { user_id: tenantUser.id } });
    if (!details) {
      return sendResponse(res, { success: false, message: 'User details not found', status: 404 });
    }
    return sendResponse(res, { data: details, message: 'User details fetched successfully', status: 200 });
  } catch (err) {
    logger.error(`[credit.controller]-[getUserDetailsByEmail]:`, err);
    return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch user details', status: 500 });
  }
};