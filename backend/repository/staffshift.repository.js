export class StaffShiftRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.Operator = sequelize.models.Operator;
    this.Shift = sequelize.models.Shift;
    this.ShiftAssignment = sequelize.models.ShiftAssignment;
    this.User = sequelize.models.User;
    this.UserDetails = sequelize.models.UserDetails;
    this.OperatorGroup = sequelize.models.OperatorGroup;
  }

  // ===== OPERATOR METHODS =====
  async createOperator(operatorData, options = {}) {
    return this.Operator.create(operatorData, options);
  }

  async getAllOperators(where = {}, includeInactive = false) {
    const finalWhere = includeInactive ? { ...where } : { ...where, is_active: true };
    return this.Operator.findAll({
      where: finalWhere,
      include: [
        { model: this.User, as: 'User', attributes: ['user_id', 'email'] },
        { model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }
      ],
      order: [['operator_id', 'ASC']]
    });
  }

  async getOperatorById(id) {
    return this.Operator.findByPk(id, {
      include: [
        { model: this.User, as: 'User', attributes: ['user_id', 'email'] },
        { model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }
      ]
    });
  }

  async updateOperator(id, updateData) {
    const operator = await this.Operator.findByPk(id);
    if (!operator) throw new Error('Operator not found');
    return await operator.update(updateData);
  }

  async deleteOperator(id) {
    const operator = await this.Operator.findByPk(id);
    if (!operator) throw new Error('Operator not found');
    return await operator.update({ is_active: false });
  }

  async getAvailableOperators() {
    return this.Operator.findAll({
      where: { 
        status: 'available',
        is_active: true 
      },
      include: [
        { model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }
      ],
      order: [['operator_id', 'ASC']]
    });
  }

  // ===== SHIFT METHODS =====
  async createShift(shiftData) {
    return this.Shift.create(shiftData);
  }

  async getAllShifts(where = {}) {
    return this.Shift.findAll({
      where: { ...where, is_active: true },
      order: [['start_time', 'ASC']]
    });
  }

  async getShiftById(id) {
    return this.Shift.findByPk(id);
  }

  async updateShift(id, updateData) {
    const shift = await this.Shift.findByPk(id);
    if (!shift) throw new Error('Shift not found');
    return await shift.update(updateData);
  }

  async deleteShift(id) {
    const shift = await this.Shift.findByPk(id);
    if (!shift) throw new Error('Shift not found');
    return await shift.update({ is_active: false });
  }

  // ===== OPERATOR GROUP METHODS =====
  async createOperatorGroup(groupData) {
    return this.OperatorGroup.create(groupData);
  }

  async getAllOperatorGroups() {
    return this.OperatorGroup.findAll({
      include: [
        { 
          model: this.User, 
          as: 'Cashier', 
          attributes: ['user_id', 'email'],
          include: [{ model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }]
        }
      ],
      order: [['name', 'ASC']]
    });
  }

  async getOperatorGroupById(id) {
    return this.OperatorGroup.findByPk(id, {
      include: [
        { 
          model: this.User, 
          as: 'Cashier', 
          attributes: ['user_id', 'email'],
          include: [{ model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }]
        },
        {
          model: this.User,
          as: 'Operators',
          attributes: ['user_id', 'email'],
          include: [{ model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }]
        }
      ]
    });
  }

  async updateOperatorGroup(id, updateData) {
    const group = await this.OperatorGroup.findByPk(id);
    if (!group) throw new Error('Operator group not found');
    return await group.update(updateData);
  }

  async deleteOperatorGroup(id) {
    const group = await this.OperatorGroup.findByPk(id);
    if (!group) throw new Error('Operator group not found');
    return await group.destroy();
  }

  // ===== SHIFT ASSIGNMENT METHODS =====
  async createShiftAssignment(assignmentData) {
    return this.ShiftAssignment.create(assignmentData);
  }

  async getShiftAssignments(date, shiftId = null) {
    const where = { date };
    if (shiftId) where.shift_id = shiftId;
    
    return this.ShiftAssignment.findAll({
      where,
      include: [
        { model: this.User, as: 'User', attributes: ['user_id', 'email'] },
        { model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] },
        { model: this.Shift, as: 'Shift', attributes: ['name', 'start_time', 'end_time', 'shift_type'] }
      ],
      order: [['created_at', 'ASC']]
    });
  }

  async getShiftAssignmentsByUser(userId, date = null) {
    const where = { user_id: userId };
    if (date) where.date = date;
    
    return this.ShiftAssignment.findAll({
      where,
      include: [
        { model: this.Shift, as: 'Shift', attributes: ['name', 'start_time', 'end_time', 'shift_type'] }
      ],
      order: [['date', 'DESC'], ['created_at', 'ASC']]
    });
  }

  async updateShiftAssignment(id, updateData) {
    const assignment = await this.ShiftAssignment.findByPk(id);
    if (!assignment) throw new Error('Assignment not found');
    return await assignment.update(updateData);
  }

  async deleteShiftAssignment(id) {
    const assignment = await this.ShiftAssignment.findByPk(id);
    if (!assignment) throw new Error('Assignment not found');
    return await assignment.destroy();
  }

  // ===== SHIFT MANAGEMENT METHODS =====
  async getUserCurrentShift(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    return this.ShiftAssignment.findOne({
      where: {
        user_id: userId,
        date: today,
        status: ['assigned', 'checked-in']
      },
      include: [
        { model: this.Shift, as: 'Shift' }
      ]
    });
  }

  async checkInUser(userId, assignmentId) {
    return this.ShiftAssignment.update(
      { 
        status: 'checked-in',
        check_in_time: new Date()
      },
      { 
        where: { 
          id: assignmentId,
          user_id: userId
        }
      }
    );
  }

  async checkOutUser(userId, assignmentId) {
    return this.ShiftAssignment.update(
      { 
        status: 'checked-out',
        check_out_time: new Date()
      },
      { 
        where: { 
          id: assignmentId,
          user_id: userId
        }
      }
    );
  }
}
 