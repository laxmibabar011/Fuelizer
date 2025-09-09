import DateUtil from '../util/date.util.js';
import { Op } from 'sequelize';

export class OperationsRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.OperationalDay = sequelize.models.OperationalDay;
    this.ShiftLedger = sequelize.models.ShiftLedger;
    this.MeterReading = sequelize.models.MeterReading;
    this.User = sequelize.models.User;
    this.Shift = sequelize.models.Shift;
    this.Nozzle = sequelize.models.Nozzle;
  }

  // ===== OPERATIONAL DAY METHODS =====
  async createOperationalDay(businessDate, options = {}) {
    return await this.OperationalDay.create({
      business_date: businessDate,
      status: 'OPEN'
    }, options);
  }

  async getOperationalDayByDate(businessDate) {
    return await this.OperationalDay.findOne({
      where: { business_date: businessDate }
    });
  }

  async getCurrentOperationalDay() {
    const today = DateUtil.today();
    return await this.getOperationalDayByDate(today);
  }

  async closeOperationalDay(operationalDayId) {
    return await this.OperationalDay.update(
      { status: 'CLOSED' },
      { where: { id: operationalDayId } }
    );
  }

  // ===== SHIFT LEDGER METHODS =====
  async createShiftLedger(ledgerData, options = {}) {
    return await this.ShiftLedger.create(ledgerData, options);
  }

  async getActiveShiftLedger(operationalDayId) {
    return await this.ShiftLedger.findOne({
      where: {
        operational_day_id: operationalDayId,
        status: 'ACTIVE'
      },
      include: [
        { model: this.User, as: 'FuelAdmin' },
        { model: this.Shift }
      ]
    });
  }

  async getShiftLedgerById(ledgerId) {
    return await this.ShiftLedger.findByPk(ledgerId, {
      include: [
        { model: this.User, as: 'FuelAdmin' },
        { model: this.Shift },
        { model: this.OperationalDay }
      ]
    });
  }

  async endShiftLedger(ledgerId, closingData, options = {}) {
    return await this.ShiftLedger.update(
      {
        ...closingData,
        status: 'ENDED',
        ended_at: DateUtil.nowDate()
      },
      { where: { id: ledgerId }, ...options }
    );
  }

  async getShiftLedgersByOperationalDay(operationalDayId) {
    return await this.ShiftLedger.findAll({
      where: { operational_day_id: operationalDayId },
      include: [
        { model: this.User, as: 'FuelAdmin' },
        { model: this.Shift }
      ],
      order: [['started_at', 'ASC']]
    });
  }

  // ===== METER READING METHODS =====
  async createMeterReading(readingData, options = {}) {
    return await this.MeterReading.create(readingData, options);
  }

  async getMeterReadingsByShiftLedger(shiftLedgerId) {
    return await this.MeterReading.findAll({
      where: { shift_ledger_id: shiftLedgerId },
      include: [{ 
        model: this.Nozzle
      }],
      order: [['id', 'ASC']]
    });
  }

  async updateMeterReading(readingId, updateData) {
    return await this.MeterReading.update(updateData, {
      where: { id: readingId }
    });
  }

  async getMeterReadingById(readingId) {
    return await this.MeterReading.findByPk(readingId, {
      include: [
        { model: this.Nozzle },
        { model: this.ShiftLedger }
      ]
    });
  }

  // ===== SHIFT STATUS METHODS =====
  async getUserShiftStatusToday(userId) {
    const today = DateUtil.today();
    const operationalDay = await this.getOperationalDayByDate(today);
    
    if (!operationalDay) {
      return {
        hasActiveShift: false,
        hasEndedShift: false,
        canStartShift: true,
        activeShift: null,
        endedShift: null
      };
    }

    const activeShift = await this.ShiftLedger.findOne({
      where: {
        operational_day_id: operationalDay.id,
        fuel_admin_id: userId,
        status: 'ACTIVE'
      },
      include: [
        { model: this.User, as: 'FuelAdmin' },
        { model: this.Shift }
      ]
    });

    const endedShift = await this.ShiftLedger.findOne({
      where: {
        operational_day_id: operationalDay.id,
        fuel_admin_id: userId,
        status: 'ENDED'
      },
      include: [
        { model: this.User, as: 'FuelAdmin' },
        { model: this.Shift }
      ]
    });

    return {
      hasActiveShift: !!activeShift,
      hasEndedShift: !!endedShift,
      canStartShift: !activeShift && !endedShift,
      activeShift,
      endedShift,
      operationalDay
    };
  }

  // ===== SHIFT SEQUENCE METHODS =====
  async getCurrentExpectedShift() {
    // Get all manager shifts ordered by start time
    const managerShifts = await this.Shift.findAll({
      where: { 
        shift_type: 'MANAGER',
        is_active: true 
      },
      order: [['start_time', 'ASC']]
    });

    if (managerShifts.length === 0) {
      return null;
    }

    // Find which shift window we're currently in
    for (const shift of managerShifts) {
      if (DateUtil.isNowWithin(shift.start_time, shift.end_time)) {
        return shift;
      }
    }

    // If not in any window, return the next upcoming shift
    const now = DateUtil.nowDate();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const shift of managerShifts) {
      const [startHour, startMin] = shift.start_time.split(':').map(Number);
      const shiftStartTime = startHour * 60 + startMin;
      
      if (shiftStartTime > currentTime) {
        return shift;
      }
    }

    // If past all shifts for today, return first shift (for next day)
    return managerShifts[0];
  }

  // ===== COMPOSITE METHODS =====
  async startManagerShift(userId, shiftId, openingCash = null) {
    return await this.sequelize.transaction(async (t) => {
      // Get or create operational day
      const today = DateUtil.today();
      let operationalDay = await this.getOperationalDayByDate(today);
      
      if (!operationalDay) {
        operationalDay = await this.createOperationalDay(today, { transaction: t });
      }

      // Check if there's already an active shift
      const activeShift = await this.getActiveShiftLedger(operationalDay.id);
      if (activeShift) {
        throw new Error('There is already an active shift for today');
      }

      // Check if this user has already completed a shift today
      const userEndedShiftToday = await this.ShiftLedger.findOne({
        where: {
          operational_day_id: operationalDay.id,
          fuel_admin_id: userId,
          status: 'ENDED'
        }
      });
      
      if (userEndedShiftToday) {
        throw new Error(`You have already completed a shift today (${operationalDay.business_date}). Cannot start another shift on the same operational day.`);
      }

      // Check if this user has an active shift today (shouldn't happen, but safety check)
      const userActiveShiftToday = await this.ShiftLedger.findOne({
        where: {
          operational_day_id: operationalDay.id,
          fuel_admin_id: userId,
          status: 'ACTIVE'
        }
      });
      
      if (userActiveShiftToday) {
        throw new Error('You already have an active shift running today.');
      }

      // Create new shift ledger
      const shiftLedger = await this.createShiftLedger({
        operational_day_id: operationalDay.id,
        shift_master_id: shiftId,
        fuel_admin_id: userId,
        opening_cash: openingCash,
        status: 'ACTIVE'
      }, { transaction: t });

      // Prefill opening meter readings for all nozzles from last ended shift's closing readings
      // But exclude shifts from the same user (manager should get readings from previous manager)
      const allNozzles = await this.Nozzle.findAll();
      for (const nozzle of allNozzles) {
        // Find the most recent ended shift's closing reading for this nozzle
        // Exclude shifts from the same user to ensure proper manager sequence
        const lastEndedShiftReading = await this.MeterReading.findOne({
          where: { 
            nozzle_id: nozzle.id,
            closing_reading: { [Op.ne]: null } // Only readings with closing values
          },
          include: [{
            model: this.ShiftLedger,
            where: { 
              status: 'ENDED',
              fuel_admin_id: { [Op.ne]: userId } // Exclude same manager's shifts
            },
            required: true
          }],
          order: [['id', 'DESC']]
        });
        
        // If no reading from other managers, get the most recent ended shift reading (fallback)
        const fallbackReading = !lastEndedShiftReading ? await this.MeterReading.findOne({
          where: { 
            nozzle_id: nozzle.id,
            closing_reading: { [Op.ne]: null }
          },
          include: [{
            model: this.ShiftLedger,
            where: { status: 'ENDED' },
            required: true
          }],
          order: [['id', 'DESC']]
        }) : null;
        
        const baseOpening = lastEndedShiftReading ? 
          lastEndedShiftReading.closing_reading : 
          (fallbackReading ? fallbackReading.closing_reading : 0);
        
        await this.createMeterReading({
          shift_ledger_id: shiftLedger.id,
          nozzle_id: nozzle.id,
          opening_reading: baseOpening,
          test_litres: 0,
          closing_reading: null,
          calculated_sales_litres: null,
        }, { transaction: t });
      }

      return shiftLedger;
    });
  }

  async endManagerShift(ledgerId, closingReadings, closingCash = null) {
    return await this.sequelize.transaction(async (t) => {
      // Update shift ledger
      await this.endShiftLedger(ledgerId, { closing_cash: closingCash }, { transaction: t });

      // Save meter readings by updating existing rows created at shift start
      const readings = [];
      for (const r of closingReadings) {
        const nozzleId = r.nozzle_id || r.nozzleId;
        const closing = r.closing_reading ?? r.closingReading;
        if (nozzleId == null || closing == null) continue;
        // Find existing reading for this ledger/nozzle
        let existing = await this.MeterReading.findOne({
          where: { shift_ledger_id: ledgerId, nozzle_id: nozzleId },
          transaction: t
        });
        if (!existing) {
          // Fallback: create if missing, with opening 0
          existing = await this.createMeterReading({
            shift_ledger_id: ledgerId,
            nozzle_id: nozzleId,
            opening_reading: 0,
            test_litres: 5,
            closing_reading: null,
            calculated_sales_litres: null,
          }, { transaction: t });
        }
        const opening = Number(existing.opening_reading || 0);
        const testLitres = Number(r.test_litres ?? r.testLitres ?? existing.test_litres ?? 0);
        const sales = Number(closing) - opening - testLitres;
        await this.MeterReading.update({
          closing_reading: closing,
          test_litres: testLitres,
          calculated_sales_litres: sales,
        }, { where: { id: existing.id }, transaction: t });
        const updated = await this.MeterReading.findByPk(existing.id, { transaction: t });
        readings.push(updated);
      }

      // Check if this was the last shift of the day
      const ledger = await this.getShiftLedgerById(ledgerId);
      const allShifts = await this.getShiftLedgersByOperationalDay(ledger.operational_day_id);
      const hasActiveShifts = allShifts.some(shift => shift.status === 'ACTIVE');

      if (!hasActiveShifts) {
        // Close the operational day
        await this.closeOperationalDay(ledger.operational_day_id, { transaction: t });
      }

      return { ledger, readings };
    });
  }

}
