import { sendResponse } from '../util/response.util.js';
import DateUtil from '../util/date.util.js';
import { StaffShiftRepository } from '../repository/staffshift.repository.js';
import { hashPassword } from '../util/auth.util.js';
import { randomUUID } from 'crypto';
import { UserRepository } from '../repository/user.repository.js';

export default class StaffShiftController {
  // ===== OPERATOR ENDPOINTS =====
  static async onboardAdmin(req, res) {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        return sendResponse(res, { success: false, error: 'name, email and password are required', message: 'Validation error', status: 400 });
      }

      const { tenantSequelize, tenantModels: { Role } } = req;
      const userRepo = new UserRepository(tenantSequelize);

      const existing = await userRepo.findTenantUserByEmail(email);
      if (existing) {
        return sendResponse(res, { success: false, error: 'Email already in use', message: 'Onboarding failed', status: 409 });
      }

      const result = await tenantSequelize.transaction(async (t) => {
        // Ensure fuel-admin role exists
        let adminRole = await Role.findOne({ where: { name: 'fuel-admin' } });
        if (!adminRole) {
          adminRole = await userRepo.createRole({ name: 'fuel-admin' }, { transaction: t });
        }

        const userId = randomUUID();
        const password_hash = await hashPassword(password);

        const user = await userRepo.createTenantUser({
          user_id: userId,
          email,
          password_hash,
          role_id: adminRole.id,
        }, { transaction: t });

        const details = await userRepo.createUserDetails({
          user_id: userId,
          full_name: name,
          email,
          phone: phone || null,
        }, { transaction: t });

        return { user, details };
      });

      return sendResponse(res, { data: result, message: 'Fuel admin onboarded successfully', status: 201 });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to onboard fuel admin', status: 500 });
    }
  }

  static async listAdmins(req, res) {
    try {
      const { tenantSequelize, tenantModels: { Role } } = req;
      const role = await Role.findOne({ where: { name: 'fuel-admin' } });
      if (!role) {
        return sendResponse(res, { data: [], message: 'No managers found' });
      }
      const { User, UserDetails, Shift } = req.tenantModels;
      const admins = await User.findAll({
        where: { role_id: role.id },
        include: [
          { model: UserDetails, as: 'UserDetails' },
          { model: Shift, as: 'DefaultManagerShift', attributes: ['id','name','start_time','end_time','shift_type'] }
        ],
        order: [['email', 'ASC']]
      });
      return sendResponse(res, { data: admins, message: 'Managers fetched' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch managers', status: 500 });
    }
  }

  // List available manager shifts (unassigned for today)
  static async listAvailableManagerShifts(req, res) {
    try {
      const { tenantSequelize } = req;
      const { Shift, User } = tenantSequelize.models;
      // Find MANAGER shifts and exclude those taken via permanent mapping
      const managerShifts = await Shift.findAll({ where: { shift_type: 'MANAGER', is_active: true } });
      const taken = await User.findAll({ where: { default_manager_shift_id: managerShifts.map((s) => s.id) }, attributes: ['default_manager_shift_id'] });
      const takenSet = new Set(taken.map((u) => u.default_manager_shift_id));
      const available = managerShifts.filter((s) => !takenSet.has(s.id));
      return sendResponse(res, { data: available, message: 'Available manager shifts for today' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch available shifts', status: 500 });
    }
  }

  // Assign manager to a shift (applies today if before start and not active, else next day)
  static async assignManagerShift(req, res) {
    try {
      const { user_id, shift_id } = req.body;
      if (!user_id || !shift_id) {
        return sendResponse(res, { success: false, error: 'user_id and shift_id are required', message: 'Validation error', status: 400 });
      }
      const { tenantSequelize } = req;
      const { Shift, User } = tenantSequelize.models;
      const shift = await Shift.findByPk(shift_id);
      if (!shift || shift.shift_type !== 'MANAGER' || shift.is_active === false) {
        return sendResponse(res, { success: false, error: 'Invalid manager shift', message: 'Cannot assign', status: 400 });
      }
      // Permanent manager mapping: set default_manager_shift_id on the user
      const user = await User.findByPk(user_id);
      if (!user) {
        return sendResponse(res, { success: false, error: 'User not found', message: 'Cannot assign', status: 404 });
      }
      // Ensure no other user has this shift
      const conflict = await User.findOne({ where: { default_manager_shift_id: shift_id } });
      if (conflict && conflict.user_id !== user_id) {
        return sendResponse(res, { success: false, error: 'Shift already assigned permanently', message: 'Conflict', status: 409 });
      }
      await user.update({ default_manager_shift_id: shift_id });
      return sendResponse(res, { data: { user_id, default_manager_shift_id: shift_id }, message: 'Manager default shift assigned', status: 201 });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to assign shift', status: 500 });
    }
  }

  // Unassign manager shift (only if not checked-in / active today)
  static async unassignManagerShift(req, res) {
    try {
      const { user_id, shift_id } = req.body;
      if (!user_id || !shift_id) {
        return sendResponse(res, { success: false, error: 'user_id and shift_id are required', message: 'Validation error', status: 400 });
      }
      const { tenantSequelize } = req;
      const { User } = tenantSequelize.models;
      const user = await User.findByPk(user_id);
      if (!user || user.default_manager_shift_id !== Number(shift_id)) {
        return sendResponse(res, { success: false, error: 'No permanent assignment found', message: 'Nothing to unassign', status: 404 });
      }
      await user.update({ default_manager_shift_id: null });
      return sendResponse(res, { data: {}, message: 'Manager default shift unassigned' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to unassign shift', status: 500 });
    }
  }
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
          operator_name: name,
          duty: 'attendant',
          status: 'available',
          join_date: DateUtil.nowDate(),
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

  // ===== OPERATOR GROUP ENDPOINTS =====
  static async createOperatorGroup(req, res) {
    try {
      const { name, cashierId, shiftId } = req.body;
      
      if (!name || !cashierId || !shiftId) {
        return sendResponse(res, { 
          success: false, 
          error: 'Name, cashier ID and shift ID are required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const repo = new StaffShiftRepository(req.tenantSequelize);
      const group = await repo.createOperatorGroup({ name, cashier_id: cashierId, shift_id: shiftId });
      return sendResponse(res, { data: group, message: 'Operator group created successfully', status: 201 });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create operator group', status: 500 });
    }
  }

  static async getAllOperatorGroups(req, res) {
    try {
      const { shiftId } = req.query;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const groups = await repo.getAllOperatorGroups(shiftId);
      return sendResponse(res, { data: groups, message: 'Operator groups fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch operator groups', status: 500 });
    }
  }

  static async getOperatorGroupById(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const group = await repo.getOperatorGroupById(id);
      
      if (!group) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Operator group not found', status: 404 });
      }
      
      return sendResponse(res, { data: group, message: 'Operator group fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch operator group', status: 500 });
    }
  }

  static async updateOperatorGroup(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const group = await repo.updateOperatorGroup(id, req.body);
      return sendResponse(res, { data: group, message: 'Operator group updated successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update operator group', status: 500 });
    }
  }

  static async deleteOperatorGroup(req, res) {
    try {
      const { id } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      await repo.deleteOperatorGroup(id);
      return sendResponse(res, { data: {}, message: 'Operator group deleted successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete operator group', status: 500 });
    }
  }

  static async setGroupAttendants(req, res) {
    try {
      const { groupId } = req.params;
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
        return sendResponse(res, { 
          success: false, 
          error: 'User IDs array is required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const repo = new StaffShiftRepository(req.tenantSequelize);
      const result = await repo.setGroupAttendants(groupId, userIds);
      return sendResponse(res, { data: result, message: 'Group attendants updated successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update group attendants', status: 500 });
    }
  }

  static async getGroupAttendants(req, res) {
    try {
      const { groupId } = req.params;
      const repo = new StaffShiftRepository(req.tenantSequelize);
      const attendants = await repo.getGroupAttendants(groupId);
      return sendResponse(res, { data: attendants, message: 'Group attendants fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch group attendants', status: 500 });
    }
  }

  // ===== NEW: Get operators assigned to a specific shift =====
  static async getOperatorsByShift(req, res) {
    try {
      const { shiftId } = req.params;
      const { date } = req.query;
      
      if (!shiftId) {
        return sendResponse(res, { 
          success: false, 
          error: 'Shift ID is required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const repo = new StaffShiftRepository(req.tenantSequelize);
      const operators = await repo.getOperatorsByShift(shiftId, date);
      return sendResponse(res, { data: operators, message: 'Operators for shift fetched successfully' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch operators for shift', status: 500 });
    }
  }

  // ===== POS CONTEXT METHODS =====
  static async getCashierPOSContext(req, res) {
    try {
      const userId = req.user.user_id;
      const { User } = req.tenantSequelize.models;

      // Resolve tenant user ID (same pattern as in operations controller)
      let user = await User.findByPk(userId);
      if (!user && req.user?.email) {
        user = await User.findOne({ where: { email: req.user.email } });
      }

      if (!user) {
        return sendResponse(res, { 
          success: false, 
          error: 'User not found', 
          message: 'Cannot get POS context', 
          status: 404 
        });
      }

      const repo = new StaffShiftRepository(req.tenantSequelize);
      const posContext = await repo.getCashierPOSContext(user.user_id);

      if (!posContext) {
        return sendResponse(res, { 
          success: false, 
          error: 'Cashier not assigned to any operator group', 
          message: 'POS access denied. Please contact administrator.', 
          status: 403 
        });
      }

      return sendResponse(res, { 
        data: posContext, 
        message: 'POS context fetched successfully' 
      });
    } catch (err) {
      console.error('Error in getCashierPOSContext:', err);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch POS context', 
        status: 500 
      });
    }
  }

  static async validatePOSAccess(req, res) {
    try {
      const userId = req.user.user_id;
      const { nozzleId, operatorId } = req.query;
      const { User } = req.tenantSequelize.models;

      // Resolve tenant user ID
      let user = await User.findByPk(userId);
      if (!user && req.user?.email) {
        user = await User.findOne({ where: { email: req.user.email } });
      }

      if (!user) {
        return sendResponse(res, { 
          success: false, 
          error: 'User not found', 
          message: 'Cannot validate access', 
          status: 404 
        });
      }

      const repo = new StaffShiftRepository(req.tenantSequelize);
      const validations = {
        hasOperatorGroup: false,
        nozzleAccess: false,
        operatorAccess: false
      };

      // Check if cashier has operator group
      const posContext = await repo.getCashierPOSContext(user.user_id);
      validations.hasOperatorGroup = !!posContext;

      if (posContext) {
        // Validate nozzle access if provided
        if (nozzleId) {
          validations.nozzleAccess = await repo.validateCashierNozzleAccess(user.user_id, nozzleId);
        }

        // Validate operator access if provided
        if (operatorId) {
          validations.operatorAccess = await repo.validateCashierOperatorAccess(user.user_id, operatorId);
        }
      }

      return sendResponse(res, { 
        data: validations, 
        message: 'Access validation completed' 
      });
    } catch (err) {
      console.error('Error in validatePOSAccess:', err);
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to validate POS access', 
        status: 500 
      });
    }
  }
} 