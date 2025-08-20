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
    const today = new Date().toISOString().split('T')[0];
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
        ended_at: new Date()
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
      include: [{ model: this.Nozzle }],
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

  // ===== COMPOSITE METHODS =====
  async startManagerShift(userId, shiftId, openingCash = null) {
    return await this.sequelize.transaction(async (t) => {
      // Get or create operational day
      const today = new Date().toISOString().split('T')[0];
      let operationalDay = await this.getOperationalDayByDate(today);
      
      if (!operationalDay) {
        operationalDay = await this.createOperationalDay(today, { transaction: t });
      }

      // Check if there's already an active shift
      const activeShift = await this.getActiveShiftLedger(operationalDay.id);
      if (activeShift) {
        throw new Error('There is already an active shift for today');
      }

      // Create new shift ledger
      const shiftLedger = await this.createShiftLedger({
        operational_day_id: operationalDay.id,
        shift_master_id: shiftId,
        fuel_admin_id: userId,
        opening_cash: openingCash,
        status: 'ACTIVE'
      }, { transaction: t });

      return shiftLedger;
    });
  }

  async endManagerShift(ledgerId, closingReadings, closingCash = null) {
    return await this.sequelize.transaction(async (t) => {
      // Update shift ledger
      await this.endShiftLedger(ledgerId, { closing_cash: closingCash }, { transaction: t });

      // Save meter readings
      const readings = [];
      for (const reading of closingReadings) {
        const meterReading = await this.createMeterReading({
          shift_ledger_id: ledgerId,
          ...reading
        }, { transaction: t });
        readings.push(meterReading);
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

  async getDailySummary(businessDate) {
    const operationalDay = await this.getOperationalDayByDate(businessDate);
    if (!operationalDay) {
      return null;
    }

    const shiftLedgers = await this.getShiftLedgersByOperationalDay(operationalDay.id);
    
    // Get all meter readings for the day
    const allReadings = [];
    for (const ledger of shiftLedgers) {
      const readings = await this.getMeterReadingsByShiftLedger(ledger.id);
      allReadings.push(...readings);
    }

    return {
      operationalDay,
      shiftLedgers,
      meterReadings: allReadings
    };
  }
}
