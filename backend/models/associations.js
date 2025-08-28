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
    ShiftAssignment
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

  console.log('[associations.js]: Cross-model associations set up successfully');
};
