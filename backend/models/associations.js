// Cross-model associations setup
// This file handles all associations between models from different modules
// Call this function after all models are initialized

export const setupAssociations = (models) => {
  const {
    User,
    UserDetails,
    OperatorGroup,
    Shift,
    OperatorGroupMember,
    OperatorGroupBooth,
    Booth,
    Operator,
    ShiftAssignment,
    MeterReading,
    ShiftLedger,
    Nozzle
  } = models;

  // ===== OPERATOR GROUP ASSOCIATIONS =====
  if (OperatorGroup && Shift) {
    OperatorGroup.belongsTo(Shift, { foreignKey: 'shift_id', as: 'Shift' });
  }
  
  if (OperatorGroup && OperatorGroupMember) {
    OperatorGroup.hasMany(OperatorGroupMember, { foreignKey: 'operator_group_id', as: 'Members' });
  }

  // ===== OPERATOR GROUP MEMBER ASSOCIATIONS =====
  if (OperatorGroupMember && OperatorGroup) {
    OperatorGroupMember.belongsTo(OperatorGroup, { foreignKey: 'operator_group_id', as: 'OperatorGroup' });
  }
  
  if (OperatorGroupMember && User) {
    OperatorGroupMember.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id', as: 'User' });
  }
  
  if (OperatorGroupMember && UserDetails) {
    OperatorGroupMember.belongsTo(UserDetails, { foreignKey: 'user_id', targetKey: 'user_id', as: 'UserDetails' });
  }

  // ===== OPERATOR GROUP BOOTH ASSOCIATIONS =====
  if (OperatorGroupBooth && OperatorGroup) {
    OperatorGroupBooth.belongsTo(OperatorGroup, { foreignKey: 'operator_group_id', as: 'OperatorGroup' });
  }
  
  if (OperatorGroupBooth && Booth) {
    OperatorGroupBooth.belongsTo(Booth, { foreignKey: 'booth_id', as: 'Booth' });
  }

  // ===== OPERATOR ASSOCIATIONS =====
  if (Operator && User) {
    Operator.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id', as: 'User' });
  }
  
  if (Operator && UserDetails) {
    Operator.belongsTo(UserDetails, { foreignKey: 'user_id', targetKey: 'user_id', as: 'UserDetails' });
  }

  // Permanent default WORKER shift for operator
  if (Operator && Shift) {
    Operator.belongsTo(Shift, { foreignKey: 'default_shift_id', as: 'DefaultShift' });
    // Optional: enable reverse lookup
    Shift.hasMany(Operator, { foreignKey: 'default_shift_id', as: 'DefaultShiftOperators' });
  }

  // Permanent default MANAGER shift for user (fuel-admin)
  if (User && Shift) {
    User.belongsTo(Shift, { foreignKey: 'default_manager_shift_id', as: 'DefaultManagerShift' });
    Shift.hasMany(User, { foreignKey: 'default_manager_shift_id', as: 'DefaultManagerUsers' });
  }

  // ===== SHIFT ASSIGNMENT ASSOCIATIONS =====
  if (Shift && ShiftAssignment) {
    Shift.hasMany(ShiftAssignment, { foreignKey: 'shift_id', as: 'Assignments' });
  }
  
  if (ShiftAssignment && Shift) {
    ShiftAssignment.belongsTo(Shift, { foreignKey: 'shift_id', as: 'Shift' });
  }
  
  if (ShiftAssignment && User) {
    ShiftAssignment.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id', as: 'User' });
  }
  
  if (ShiftAssignment && UserDetails) {
    ShiftAssignment.belongsTo(UserDetails, { foreignKey: 'user_id', targetKey: 'user_id', as: 'UserDetails' });
  }

  // ===== METER READING ASSOCIATIONS =====
  if (MeterReading && ShiftLedger) {
    MeterReading.belongsTo(ShiftLedger, { foreignKey: 'shift_ledger_id' });
    ShiftLedger.hasMany(MeterReading, { foreignKey: 'shift_ledger_id' });
  }
  
  if (MeterReading && Nozzle) {
    MeterReading.belongsTo(Nozzle, { foreignKey: 'nozzle_id' });
    Nozzle.hasMany(MeterReading, { foreignKey: 'nozzle_id' });
  }

  console.log('[associations.js]: Cross-model associations set up successfully');
};
