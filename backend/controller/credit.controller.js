import { sendResponse } from '../util/response.util.js';
import { logger } from '../util/logger.util.js';
import { UserRepository } from '../repository/user.repository.js';
import { CreditRepository } from '../repository/credit.repository.js';
import { hashPassword } from '../util/auth.util.js';

export default class CreditController {
  static async onboardPartner(req, res) {
    try {
      const {
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        creditLimit,
        userName,
        userEmail,
        userPassword,
        city,
        state,
        country,
        postal_code,
        gstin
      } = req.body;

      if (!companyName || !contactName || !contactEmail || !contactPhone || !creditLimit || !userName || !userEmail || !userPassword) {
        return sendResponse(res, { success: false, error: 'Missing required fields', message: 'Onboarding failed', status: 400 });
      }

      const { tenantSequelize, tenantModels: { User, Role, UserDetails, CreditAccount } } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const userRepo = new UserRepository(tenantSequelize);

      const result = await tenantSequelize.transaction(async (t) => {
        const creditAccount = await creditRepo.createCreditAccount({
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          creditLimit
        }, { transaction: t });

        let partnerRole = await Role.findOne({ where: { name: 'partner' } });
        if (!partnerRole) {
          partnerRole = await userRepo.createRole({ name: 'partner' }, { transaction: t });
        }

        const hashedPassword = await hashPassword(userPassword);
        const tenantUser = await userRepo.createTenantUser({
          user_id: `user_${Date.now()}`,
          email: userEmail,
          password_hash: hashedPassword,
          role_id: partnerRole.id
        }, { transaction: t });

        await userRepo.createUserDetails({
          user_id: tenantUser.user_id,
          full_name: contactName,
          email: contactEmail,
          phone: contactPhone,
          city: city || null,
          state: state || null,
          country: country || null,
          postal_code: postal_code || null,
          gstin: gstin || null
        }, { transaction: t });

        return { creditAccount, tenantUser };
      });

      logger.info(`[CreditController]-[onboardPartner]: Credit partner ${companyName} onboarded successfully`);
      return sendResponse(res, { data: result, message: 'Credit partner onboarded successfully', status: 201 });
    } catch (err) {
      logger.error(`[CreditController]-[onboardPartner]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to onboard credit partner', status: 500 });
    }
  }

  static async getCreditPartnerById(req, res) {
    try {
      const { id } = req.params;
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const partner = await creditRepo.getCreditAccountById(id);
      if (!partner) {
        return sendResponse(res, { success: false, error: 'Partner not found', message: 'Not found', status: 404 });
      }
      return sendResponse(res, { data: partner, message: 'Credit partner details fetched successfully', status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[getCreditPartnerById]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch credit partner details', status: 500 });
    }
  }

  static async updatePartnerStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['Active', 'Suspended', 'Inactive'].includes(status)) {
        return sendResponse(res, { success: false, error: 'Invalid status', message: 'Status must be Active, Suspended, or Inactive', status: 400 });
      }
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const partner = await creditRepo.getCreditAccountById(id);
      if (!partner) {
        return sendResponse(res, { success: false, error: 'Partner not found', message: 'Not found', status: 404 });
      }
      partner.status = status;
      await partner.save();
      return sendResponse(res, { data: partner, message: `Partner status updated to ${status}`, status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[updatePartnerStatus]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update partner status', status: 500 });
    }
  }

  static async updateCreditLimit(req, res) {
    try {
      const { id } = req.params;
      const { creditLimit, utilisedBod, adhocAddition } = req.body;
      
      // Validate creditLimit
      if (creditLimit !== undefined && (creditLimit === null || Number.isNaN(Number(creditLimit)))) {
        return sendResponse(res, { success: false, error: 'Invalid creditLimit', message: 'creditLimit must be a number', status: 400 });
      }
      
      // Validate utilisedBod
      if (utilisedBod !== undefined && (utilisedBod === null || Number.isNaN(Number(utilisedBod)))) {
        return sendResponse(res, { success: false, error: 'Invalid utilisedBod', message: 'utilisedBod must be a number', status: 400 });
      }
      
      // Validate adhocAddition
      if (adhocAddition !== undefined && (adhocAddition === null || Number.isNaN(Number(adhocAddition)))) {
        return sendResponse(res, { success: false, error: 'Invalid adhocAddition', message: 'adhocAddition must be a number', status: 400 });
      }
      
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const updated = await creditRepo.updateCreditLimit(id, creditLimit, utilisedBod, adhocAddition);
      if (!updated) {
        return sendResponse(res, { success: false, error: 'Partner not found', message: 'Not found', status: 404 });
      }
      return sendResponse(res, { data: updated, message: 'Credit information updated successfully', status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[updateCreditLimit]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update credit information', status: 500 });
    }
  }

  static async listCreditPartners(req, res) {
    try {
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const partners = await creditRepo.getAllCreditAccounts();
      return sendResponse(res, { data: partners, message: 'Credit partners fetched successfully', status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[listCreditPartners]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch credit partners', status: 500 });
    }
  }

  static async getVehiclesByPartnerId(req, res) {
    try {
      const { partnerId } = req.params;
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const vehicles = await creditRepo.getVehiclesByPartnerId(partnerId);
      return sendResponse(res, { data: vehicles, message: 'Vehicles fetched successfully', status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[getVehiclesByPartnerId]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch vehicles', status: 500 });
    }
  }

  static async addVehicles(req, res) {
    try {
      const { partnerId } = req.params;
      const { vehicles } = req.body;
      if (!Array.isArray(vehicles) || vehicles.length === 0) {
        return sendResponse(res, { success: false, error: 'No vehicles provided', message: 'No vehicles provided', status: 400 });
      }
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const created = await creditRepo.addVehicles(partnerId, vehicles);
      return sendResponse(res, { data: created, message: 'Vehicles added successfully', status: 201 });
    } catch (err) {
      logger.error(`[CreditController]-[addVehicles]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to add vehicles', status: 500 });
    }
  }

  static async updateVehicle(req, res) {
    try {
      const { vehicleId } = req.params;
      const data = req.body;
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const updated = await creditRepo.updateVehicle(vehicleId, data);
      if (!updated) {
        return sendResponse(res, { success: false, error: 'Vehicle not found', message: 'Vehicle not found', status: 404 });
      }
      return sendResponse(res, { data: updated, message: 'Vehicle updated successfully', status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[updateVehicle]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update vehicle', status: 500 });
    }
  }

  static async setVehicleStatus(req, res) {
    try {
      const { vehicleId } = req.params;
      const { status } = req.body;
      if (!['Active', 'Inactive'].includes(status)) {
        return sendResponse(res, { success: false, error: 'Invalid status', message: 'Status must be Active or Inactive', status: 400 });
      }
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const updated = await creditRepo.setVehicleStatus(vehicleId, status);
      if (!updated) {
        return sendResponse(res, { success: false, error: 'Vehicle not found', message: 'Vehicle not found', status: 404 });
      }
      return sendResponse(res, { data: updated, message: `Vehicle status updated to ${status}`, status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[setVehicleStatus]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update vehicle status', status: 500 });
    }
  }

  static async deleteVehicle(req, res) {
    try {
      const { vehicleId } = req.params;
      const { tenantSequelize } = req;
      const creditRepo = new CreditRepository(tenantSequelize);
      const deleted = await creditRepo.deleteVehicle(vehicleId);
      if (!deleted) {
        return sendResponse(res, { success: false, error: 'Vehicle not found', message: 'Vehicle not found', status: 404 });
      }
      return sendResponse(res, { data: {}, message: 'Vehicle deleted successfully', status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[deleteVehicle]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete vehicle', status: 500 });
    }
  }

  static async getUserDetails(req, res) {
    try {
      const { userId } = req.params;
      const { tenantModels: { UserDetails } } = req;
      const details = await UserDetails.findOne({ where: { user_id: userId } });
      if (!details) {
        return sendResponse(res, { success: false, error: 'User details not found', message: 'User details not found', status: 404 });
      }
      return sendResponse(res, { data: details, message: 'User details fetched successfully', status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[getUserDetails]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch user details', status: 500 });
    }
  }

  static async getUserDetailsByEmail(req, res) {
    try {
      const { email } = req.params;
      const { tenantModels: { User, UserDetails } } = req;
      const tenantUser = await User.findOne({ where: { email } });
      if (!tenantUser) {
        return sendResponse(res, { success: false, error: 'User not found', message: 'User not found', status: 404 });
      }
      const details = await UserDetails.findOne({ where: { user_id: tenantUser.user_id } });
      if (!details) {
        return sendResponse(res, { success: false, error: 'User details not found', message: 'User details not found', status: 404 });
      }
      return sendResponse(res, { data: details, message: 'User details fetched successfully', status: 200 });
    } catch (err) {
      logger.error(`[CreditController]-[getUserDetailsByEmail]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch user details', status: 500 });
    }
  }
}