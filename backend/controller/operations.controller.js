import { sendResponse } from '../util/response.util.js';
import DateUtil from '../util/date.util.js';
import { OperationsRepository } from '../repository/operations.repository.js';
import { StaffShiftRepository } from '../repository/staffshift.repository.js';
import { TransactionRepository } from '../repository/transaction.repository.js';

export default class OperationsController {
  // ===== SHIFT MANAGEMENT =====
  static async startManagerShift(req, res) {
    try {
      const { shiftId, openingCash } = req.body;
      const userId = req.user.user_id;

      if (!shiftId) {
        return sendResponse(res, { 
          success: false, 
          error: 'Shift ID is required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const operationsRepo = new OperationsRepository(req.tenantSequelize);
      const staffRepo = new StaffShiftRepository(req.tenantSequelize);

      // Verify user permanently mapped to this manager shift and window is valid now
      const { User, Shift } = req.tenantSequelize.models;
      // Resolve tenant user by id first; fall back to email (tokens may carry master id)
      let user = await User.findByPk(userId);
      if (!user && req.user?.email) {
        user = await User.findOne({ where: { email: req.user.email } });
      }
      const shift = await Shift.findByPk(shiftId);
      if (!shift || shift.shift_type !== 'MANAGER' || shift.is_active === false) {
        return sendResponse(res, { success: false, error: 'Invalid manager shift', message: 'Cannot start shift', status: 400 });
      }
      if (!user) {
        return sendResponse(res, { success: false, error: 'User not found', message: 'Cannot start shift', status: 404 });
      }
      if (Number(user.default_manager_shift_id) !== Number(shiftId)) {
        // Dev fallback: if user selected a valid manager shiftId, set their permanent mapping now
        try {
          await user.update({ default_manager_shift_id: shiftId });
        } catch (_) {
          return sendResponse(res, { success: false, error: 'User not permanently assigned to this manager shift', message: 'Cannot start shift', status: 403 });
        }
      }
      // Check if current time is within shift window
      const inWindow = DateUtil.isNowWithin(shift.start_time, shift.end_time);
      if (!inWindow) {
        return sendResponse(res, { 
          success: false, 
          error: 'Outside shift window', 
          message: `Current time is outside the shift window (${shift.start_time} - ${shift.end_time})`, 
          status: 403 
        });
      }

      // Start the shift using resolved tenant user id
      const fuelAdminId = user.user_id;
      const shiftLedger = await operationsRepo.startManagerShift(fuelAdminId, shiftId, openingCash);

      return sendResponse(res, { 
        data: shiftLedger, 
        message: 'Manager shift started successfully', 
        status: 201 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to start manager shift', 
        status: 500 
      });
    }
  }

  static async autoStartManagerShift(req, res) {
    try {
      const { openingCash } = req.body;
      const userId = req.user.user_id;

      const operationsRepo = new OperationsRepository(req.tenantSequelize);
      const { User, Shift } = req.tenantSequelize.models;

      // Resolve tenant user
      let user = await User.findByPk(userId);
      if (!user && req.user?.email) {
        user = await User.findOne({ where: { email: req.user.email } });
      }

      if (!user) {
        return sendResponse(res, { success: false, error: 'User not found', message: 'Cannot start shift', status: 404 });
      }

      if (!user.default_manager_shift_id) {
        return sendResponse(res, { 
          success: false, 
          error: 'No manager shift assigned to user', 
          message: 'Please assign a manager shift first', 
          status: 400 
        });
      }

      // Get the assigned shift
      const shift = await Shift.findByPk(user.default_manager_shift_id);
      if (!shift || shift.shift_type !== 'MANAGER' || shift.is_active === false) {
        return sendResponse(res, { 
          success: false, 
          error: 'Invalid or inactive manager shift assigned', 
          message: 'Cannot start shift', 
          status: 400 
        });
      }

      // Check if current time is within shift window
      const inWindow = DateUtil.isNowWithin(shift.start_time, shift.end_time);
      if (!inWindow) {
        // Get the expected current shift to provide better error message
        const expectedShift = await operationsRepo.getCurrentExpectedShift();
        const expectedShiftMsg = expectedShift ? 
          ` The expected shift at this time is "${expectedShift.name}" (${expectedShift.start_time} - ${expectedShift.end_time}).` : 
          '';
        
        return sendResponse(res, { 
          success: false, 
          error: 'Outside shift window', 
          message: `Current time is outside your assigned shift window (${shift.start_time} - ${shift.end_time}).${expectedShiftMsg}`, 
          status: 403 
        });
      }

      // Start the shift using the assigned shift
      const fuelAdminId = user.user_id;
      const shiftLedger = await operationsRepo.startManagerShift(fuelAdminId, user.default_manager_shift_id, openingCash);

      return sendResponse(res, { 
        data: { shiftLedger, shift }, 
        message: `Manager shift started successfully for ${shift.name}`, 
        status: 201 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to auto-start manager shift', 
        status: 500 
      });
    }
  }

  static async endManagerShift(req, res) {
    try {
      const { closingReadings, closingCash } = req.body;
      const jwtUserId = req.user.user_id;

      if (!closingReadings || !Array.isArray(closingReadings)) {
        return sendResponse(res, { 
          success: false, 
          error: 'Closing readings are required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const operationsRepo = new OperationsRepository(req.tenantSequelize);
      const staffRepo = new StaffShiftRepository(req.tenantSequelize);
      const { User } = req.tenantSequelize.models;
      // Resolve tenant user id same as in start flow
      let user = await User.findByPk(jwtUserId);
      if (!user && req.user?.email) {
        user = await User.findOne({ where: { email: req.user.email } });
      }

      // Resolve today's operational day and active shift for the day
      const operationalDay = await operationsRepo.getCurrentOperationalDay();
      if (!operationalDay) {
        return sendResponse(res, {
          success: false,
          error: 'No operational day found for today',
          message: 'Cannot end shift',
          status: 400,
        });
      }

      const activeShift = await operationsRepo.getActiveShiftLedger(operationalDay.id);
      if (!activeShift || activeShift.fuel_admin_id !== user.user_id) {
        return sendResponse(res, { 
          success: false, 
          error: 'No active shift found for this user', 
          message: 'Cannot end shift', 
          status: 403 
        });
      }

      // End the shift
      const result = await operationsRepo.endManagerShift(
        activeShift.id, 
        closingReadings, 
        closingCash
      );

      // Optional: update assignment status only if a daily assignment exists
      try {
        const today = DateUtil.today();
        const assignment = await staffRepo.getShiftAssignments(today, activeShift.shift_master_id);
        const userAssignment = assignment.find(a => a.user_id === user.user_id);
        if (userAssignment) {
          await staffRepo.checkOutUser(user.user_id, userAssignment.id);
        }
      } catch (_) {
        // ignore if daily assignments are not used
      }

      return sendResponse(res, { 
        data: result, 
        message: 'Manager shift ended successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to end manager shift', 
        status: 500 
      });
    }
  }

  // ===== METER READINGS =====
  static async getMeterReadings(req, res) {
    try {
      const { shiftLedgerId } = req.params;
      const operationsRepo = new OperationsRepository(req.tenantSequelize);

      const readings = await operationsRepo.getMeterReadingsByShiftLedger(shiftLedgerId);

      return sendResponse(res, { 
        data: readings, 
        message: 'Meter readings fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch meter readings', 
        status: 500 
      });
    }
  }

  static async updateMeterReading(req, res) {
    try {
      const { readingId } = req.params;
      const updateData = req.body;
      const operationsRepo = new OperationsRepository(req.tenantSequelize);

      const result = await operationsRepo.updateMeterReading(readingId, updateData);

      return sendResponse(res, { 
        data: result, 
        message: 'Meter reading updated successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to update meter reading', 
        status: 500 
      });
    }
  }

  // ===== DAILY OPERATIONS =====
  static async getCurrentOperationalDay(req, res) {
    try {
      const operationsRepo = new OperationsRepository(req.tenantSequelize);
      const operationalDay = await operationsRepo.getCurrentOperationalDay();

      if (!operationalDay) {
        return sendResponse(res, { 
          data: null, 
          message: 'No operational day found for today' 
        });
      }

      const shiftLedgers = await operationsRepo.getShiftLedgersByOperationalDay(operationalDay.id);

      return sendResponse(res, { 
        data: { operationalDay, shiftLedgers }, 
        message: 'Current operational day fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch current operational day', 
        status: 500 
      });
    }
  }


  // ===== SHIFT STATUS =====
  static async getCurrentShiftStatus(req, res) {
    try {
      const operationsRepo = new OperationsRepository(req.tenantSequelize);
      const { User } = req.tenantSequelize.models;

      // Get current operational day
      const operationalDay = await operationsRepo.getCurrentOperationalDay();
      
      // Get active shift if any
      const activeShift = operationalDay ? 
        await operationsRepo.getActiveShiftLedger(operationalDay.id) : null;
      
      // Get expected shift based on current time
      const expectedShift = await operationsRepo.getCurrentExpectedShift();
      
      // Get expected manager for current shift
      let expectedManager = null;
      if (expectedShift) {
        expectedManager = await User.findOne({
          where: { default_manager_shift_id: expectedShift.id },
          include: [{ 
            model: req.tenantSequelize.models.UserDetails, 
            as: 'UserDetails' 
          }]
        });
      }

      return sendResponse(res, { 
        data: {
          operationalDay,
          activeShift,
          expectedShift,
          expectedManager: expectedManager ? {
            id: expectedManager.user_id,
            email: expectedManager.email,
            name: expectedManager.UserDetails?.full_name || expectedManager.email
          } : null,
          currentTime: new Date().toLocaleTimeString(),
          canStartShift: !activeShift && expectedShift !== null
        },
        message: 'Current shift status fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch current shift status', 
        status: 500 
      });
    }
  }
  static async getUserShiftStatus(req, res) {
    try {
      const userId = req.user.user_id;
      const operationsRepo = new OperationsRepository(req.tenantSequelize);
      const { User } = req.tenantSequelize.models;

      // Resolve tenant user
      let user = await User.findByPk(userId);
      if (!user && req.user?.email) {
        user = await User.findOne({ where: { email: req.user.email } });
      }

      if (!user) {
        return sendResponse(res, { 
          success: false, 
          error: 'User not found', 
          message: 'Cannot get shift status', 
          status: 404 
        });
      }

      const shiftStatus = await operationsRepo.getUserShiftStatusToday(user.user_id);

      return sendResponse(res, { 
        data: shiftStatus, 
        message: 'User shift status fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch user shift status', 
        status: 500 
      });
    }
  }

  static async getUserCurrentShift(req, res) {
    try {
      const userId = req.user.user_id;
      const staffRepo = new StaffShiftRepository(req.tenantSequelize);

      const currentShift = await staffRepo.getUserCurrentShift(userId);

      return sendResponse(res, { 
        data: currentShift, 
        message: 'Current shift fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch current shift', 
        status: 500 
      });
    }
  }

  static async checkInShift(req, res) {
    try {
      const { assignmentId } = req.body;
      const userId = req.user.user_id;

      if (!assignmentId) {
        return sendResponse(res, { 
          success: false, 
          error: 'Assignment ID is required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const staffRepo = new StaffShiftRepository(req.tenantSequelize);
      const result = await staffRepo.checkInUser(userId, assignmentId);

      return sendResponse(res, { 
        data: result, 
        message: 'Successfully checked in to shift' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to check in to shift', 
        status: 500 
      });
    }
  }

  static async checkOutShift(req, res) {
    try {
      const { assignmentId } = req.body;
      const userId = req.user.user_id;

      if (!assignmentId) {
        return sendResponse(res, { 
          success: false, 
          error: 'Assignment ID is required', 
          message: 'Validation error', 
          status: 400 
        });
      }

      const staffRepo = new StaffShiftRepository(req.tenantSequelize);
      const result = await staffRepo.checkOutUser(userId, assignmentId);

      return sendResponse(res, { 
        data: result, 
        message: 'Successfully checked out of shift' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to check out of shift', 
        status: 500 
      });
    }
  }
}
