import { Op } from 'sequelize';

export class GroupBoothRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.models = sequelize.models;
    this.OperatorGroupBooth = sequelize.models.OperatorGroupBooth;
    this.OperatorGroup = sequelize.models.OperatorGroup;
    this.User = sequelize.models.User;
    this.UserDetails = sequelize.models.UserDetails;
    this.Shift = sequelize.models.Shift;
    this.OperatorGroupMember = sequelize.models.OperatorGroupMember;
  }

  async mapGroupToBooths(groupId, boothIds) {
    const transaction = await this.sequelize.transaction();
    try {
      // Remove existing mappings for this group not in the new list
      if (Array.isArray(boothIds) && boothIds.length > 0) {
        await this.OperatorGroupBooth.destroy({
          where: {
            operator_group_id: groupId,
            booth_id: { [Op.notIn]: boothIds }
          },
          transaction
        });
      } else {
        // If no boothIds provided, clear all mappings for this group
        await this.OperatorGroupBooth.destroy({
          where: { operator_group_id: groupId },
          transaction
        });
      }

      // Create or update new mappings
      const results = await Promise.all(boothIds.map(boothId =>
        this.OperatorGroupBooth.findOrCreate({
          where: { operator_group_id: groupId, booth_id: boothId },
          defaults: { is_active: true },
          transaction
        })
      ));
      await transaction.commit();
      return results.length;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async unmapGroupFromBooth(groupId, boothId) {
    return this.OperatorGroupBooth.destroy({
      where: { operator_group_id: groupId, booth_id: boothId }
    });
  }

  async getGroupBooths(groupId) {
    return this.OperatorGroupBooth.findAll({
      where: { operator_group_id: groupId, is_active: true },
      include: [{ model: this.sequelize.models.Booth, as: 'Booth' }]
    });
  }

  async listBoothAssignmentsByShift(shiftId) {
    return this.OperatorGroupBooth.findAll({
      where: { is_active: true },
      include: [
        {
          model: this.OperatorGroup,
          as: 'OperatorGroup',
          where: { shift_id: shiftId },
          include: [
            {
              model: this.User,
              as: 'Cashier',
              attributes: ['user_id', 'email'],
              include: [{ model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }]
            },
            {
              model: this.OperatorGroupMember,
              as: 'Members',
              where: { is_active: true },
              include: [
                {
                  model: this.User,
                  as: 'User',
                  attributes: ['user_id', 'email'],
                  include: [{ model: this.UserDetails, as: 'UserDetails', attributes: ['full_name', 'phone'] }]
                }
              ]
            },
            {
              model: this.Shift,
              as: 'Shift',
              attributes: ['id', 'name', 'start_time', 'end_time', 'shift_type']
            }
          ]
        },
        { model: this.sequelize.models.Booth, as: 'Booth' }
      ]
    });
  }
}


