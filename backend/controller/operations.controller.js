import { sendResponse } from '../util/response.util.js';
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

      // Verify user has assignment for this shift today
      const today = new Date().toISOString().split('T')[0];
      const assignment = await staffRepo.getShiftAssignments(today, shiftId);
      const userAssignment = assignment.find(a => a.user_id === userId);

      if (!userAssignment) {
        return sendResponse(res, { 
          success: false, 
          error: 'No shift assignment found for today', 
          message: 'Cannot start shift', 
          status: 403 
        });
      }

      // Start the shift
      const shiftLedger = await operationsRepo.startManagerShift(userId, shiftId, openingCash);

      // Update assignment status
      await staffRepo.checkInUser(userId, userAssignment.id);

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

  static async endManagerShift(req, res) {
    try {
      const { closingReadings, closingCash } = req.body;
      const userId = req.user.user_id;

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
      if (!activeShift || activeShift.fuel_admin_id !== userId) {
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

      // Update assignment status
      const today = new Date().toISOString().split('T')[0];
      const assignment = await staffRepo.getShiftAssignments(today, activeShift.shift_master_id);
      const userAssignment = assignment.find(a => a.user_id === userId);
      if (userAssignment) {
        await staffRepo.checkOutUser(userId, userAssignment.id);
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

  static async getDailySummary(req, res) {
    try {
      const { date } = req.params;
      const operationsRepo = new OperationsRepository(req.tenantSequelize);
      const transactionRepo = new TransactionRepository(req.tenantSequelize);

      const operationsSummary = await operationsRepo.getDailySummary(date);
      const transactionSummary = await transactionRepo.getDailySummary(date);

      return sendResponse(res, { 
        data: { 
          operations: operationsSummary, 
          transactions: transactionSummary 
        }, 
        message: 'Daily summary fetched successfully' 
      });
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch daily summary', 
        status: 500 
      });
    }
  }

  // ===== SHIFT STATUS =====
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
