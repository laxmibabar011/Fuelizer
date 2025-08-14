import { sendResponse } from '../util/response.util.js';
import { StaffShiftRepository } from '../repository/staffshift.repository.js';
import { hashPassword } from '../util/auth.util.js';
import { randomUUID } from 'crypto';
import { UserRepository } from '../repository/user.repository.js';

export default class StaffShiftController {
  // ===== OPERATOR ENDPOINTS =====
  static async onboardOperator(req, res) {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        return sendResponse(res, { success: false, error: 'name, email and password are required', message: 'Validation error', status: 400 });
      }

      const { tenantSequelize, tenantModels: { Role } } = req;
      const userRepo = new UserRepository(tenantSequelize);
      const staffRepo = new StaffShiftRepository(tenantSequelize);

      // Ensure email not taken
      const existing = await userRepo.findTenantUserByEmail(email);
      if (existing) {
        return sendResponse(res, { success: false, error: 'Email already in use', message: 'Onboarding failed', status: 409 });
      }

      // Follow same approach as CreditController (partner role)
      const result = await tenantSequelize.transaction(async (t) => {
        // Resolve operator role (create if missing)
        let operatorRole = await Role.findOne({ where: { name: 'operator' } });
        if (!operatorRole) {
          operatorRole = await userRepo.createRole({ name: 'operator' }, { transaction: t });
        }

        const userId = randomUUID();
        const password_hash = await hashPassword(password);

        const user = await userRepo.createTenantUser({
          user_id: userId,
          email,
          password_hash,
          role_id: operatorRole.id,
        }, { transaction: t });

        const details = await userRepo.createUserDetails({
          user_id: userId,
          full_name: name,
          email,
          phone: phone || null,
        }, { transaction: t });

        // Generate short operator code (<=10 chars)
        const operatorCode = `OP${Math.floor(100000 + Math.random() * 900000)}`; // e.g., OP123456
        const operator = await staffRepo.createOperator({
          operator_id: operatorCode,
          user_id: user.user_id,
          duty: 'attendant',
          status: 'available',
          join_date: new Date(),
        }, { transaction: t });

        return { operator, user, details };
      });

      return sendResponse(res, { data: result, message: 'Operator onboarded successfully', status: 201 });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to onboard operator', status: 500 });
    }
  }
  static async createOperator(req, res) {
    try {
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const operator = await repo.createOperator(req.body);
      return sendResponse(res, { data: operator, message: 'Operator created successfully', status: 201 });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create operator', status: 500 });
    }
  }

  static async getAllOperators(req, res) {
    try {
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const includeInactive = String(req.query.includeInactive || 'false') === 'true';
      const operators = await repo.getAllOperators({}, includeInactive);
      return sendResponse(res, { data: operators, message: 'Operators fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch operators', status: 500 });
    }
  }

  static async getOperatorById(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const operator = await repo.getOperatorById(id);
      
      if (!operator) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Operator not found', status: 404 });
      }
      
      return sendResponse(res, { data: operator, message: 'Operator fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch operator', status: 500 });
    }
  }

  static async updateOperator(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const operator = await repo.updateOperator(id, req.body);
      return sendResponse(res, { data: operator, message: 'Operator updated successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update operator', status: 500 });
    }
  }

  static async deleteOperator(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      await repo.deleteOperator(id);
      return sendResponse(res, { data: {}, message: 'Operator deleted successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete operator', status: 500 });
    }
  }

  static async getAvailableOperators(req, res) {
    try {
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const operators = await repo.getAvailableOperators();
      return sendResponse(res, { data: operators, message: 'Available operators fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch available operators', status: 500 });
    }
  }

  // ===== SHIFT ENDPOINTS =====
  static async createShift(req, res) {
    try {
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const shift = await repo.createShift(req.body);
      return sendResponse(res, { data: shift, message: 'Shift created successfully', status: 201 });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create shift', status: 500 });
    }
  }

  static async getAllShifts(req, res) {
    try {
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const shifts = await repo.getAllShifts();
      return sendResponse(res, { data: shifts, message: 'Shifts fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch shifts', status: 500 });
    }
  }

  static async getShiftById(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const shift = await repo.getShiftById(id);
      
      if (!shift) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Shift not found', status: 404 });
      }
      
      return sendResponse(res, { data: shift, message: 'Shift fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch shift', status: 500 });
    }
  }

  static async updateShift(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const shift = await repo.updateShift(id, req.body);
      return sendResponse(res, { data: shift, message: 'Shift updated successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update shift', status: 500 });
    }
  }

  static async deleteShift(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      await repo.deleteShift(id);
      return sendResponse(res, { data: {}, message: 'Shift deleted successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete shift', status: 500 });
    }
  }

  // ===== SHIFT ASSIGNMENT ENDPOINTS =====
  static async createShiftAssignment(req, res) {
    try {
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const assignment = await repo.createShiftAssignment(req.body);
      return sendResponse(res, { data: assignment, message: 'Shift assignment created successfully', status: 201 });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create shift assignment', status: 500 });
    }
  }

  static async getShiftAssignments(req, res) {
    try {
      const { date, shiftId } = req.query;
      
      if (!date) {
        return sendResponse(res, { success: false, error: 'Date parameter required', message: 'Validation error', status: 400 });
      }
      
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const assignments = await repo.getShiftAssignments(date, shiftId);
      return sendResponse(res, { data: assignments, message: 'Shift assignments fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch shift assignments', status: 500 });
    }
  }

  static async updateShiftAssignment(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const assignment = await repo.updateShiftAssignment(id, req.body);
      return sendResponse(res, { data: assignment, message: 'Shift assignment updated successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update shift assignment', status: 500 });
    }
  }

  static async deleteShiftAssignment(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      await repo.deleteShiftAssignment(id);
      return sendResponse(res, { data: {}, message: 'Shift assignment deleted successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete shift assignment', status: 500 });
    }
  }
} 