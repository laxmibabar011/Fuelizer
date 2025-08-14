import { initStaffShiftModels } from '../models/staffshift.model.js';

export class StaffShiftRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.models = initStaffShiftModels(sequelize);
  }

  // ===== OPERATOR METHODS =====
  async createOperator(operatorData, options = {}) {
    return this.models.Operator.create(operatorData, options);
  }

  async getAllOperators(where = {}, includeInactive = false) {
    const { User, UserDetails } = this.sequelize.models;
    const finalWhere = includeInactive ? { ...where } : { ...where, is_active: true };
    return this.models.Operator.findAll({
      where: finalWhere,
      include: [
        { model: User, as: 'User', attributes: ['user_id', 'email'] },
        { model: UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }
      ],
      order: [['operator_id', 'ASC']]
    });
  }

  async getOperatorById(id) {
    const { User, UserDetails } = this.sequelize.models;
    return this.models.Operator.findByPk(id, {
      include: [
        { model: User, as: 'User', attributes: ['user_id', 'email'] },
        { model: UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }
      ]
    });
  }

  async updateOperator(id, updateData) {
    const operator = await this.models.Operator.findByPk(id);
    if (!operator) throw new Error('Operator not found');
    return await operator.update(updateData);
  }

  async deleteOperator(id) {
    const operator = await this.models.Operator.findByPk(id);
    if (!operator) throw new Error('Operator not found');
    return await operator.update({ is_active: false });
  }

  async getAvailableOperators() {
    const { UserDetails } = this.sequelize.models;
    return this.models.Operator.findAll({
      where: { 
        status: 'available',
        is_active: true 
      },
      include: [
        { model: UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }
      ],
      order: [['operator_id', 'ASC']]
    });
  }

  // ===== SHIFT METHODS =====
  async createShift(shiftData) {
    return this.models.Shift.create(shiftData);
  }

  async getAllShifts(where = {}) {
    return this.models.Shift.findAll({
      where: { ...where, is_active: true },
      order: [['start_time', 'ASC']]
    });
  }

  async getShiftById(id) {
    return this.models.Shift.findByPk(id);
  }

  async updateShift(id, updateData) {
    const shift = await this.models.Shift.findByPk(id);
    if (!shift) throw new Error('Shift not found');
    return await shift.update(updateData);
  }

  async deleteShift(id) {
    const shift = await this.models.Shift.findByPk(id);
    if (!shift) throw new Error('Shift not found');
    return await shift.update({ is_active: false });
  }

  // ===== SHIFT ASSIGNMENT METHODS =====
  async createShiftAssignment(assignmentData) {
    return this.models.ShiftAssignment.create(assignmentData);
  }

  async getShiftAssignments(date, shiftId = null) {
    const where = { date };
    if (shiftId) where.shift_id = shiftId;
    
    return this.models.ShiftAssignment.findAll({
      where,
      include: [
        { model: this.models.Operator, as: 'Operator', include: [
          { model: this.sequelize.models.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }
        ]},
        { model: this.models.Shift, as: 'Shift', attributes: ['name', 'start_time', 'end_time'] }
      ],
      order: [['created_at', 'ASC']]
    });
  }

  async updateShiftAssignment(id, updateData) {
    const assignment = await this.models.ShiftAssignment.findByPk(id);
    if (!assignment) throw new Error('Assignment not found');
    return await assignment.update(updateData);
  }

  async deleteShiftAssignment(id) {
    const assignment = await this.models.ShiftAssignment.findByPk(id);
    if (!assignment) throw new Error('Assignment not found');
    return await assignment.destroy();
  }
} 