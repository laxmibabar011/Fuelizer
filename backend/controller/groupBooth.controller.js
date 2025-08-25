import { sendResponse } from '../util/response.util.js';
import { GroupBoothRepository } from '../repository/groupBooth.repository.js';

export default class GroupBoothController {
  static async mapGroupToBooths(req, res) {
    try {
      const { groupId } = req.params;
      const { boothIds } = req.body;
      if (!groupId || !Array.isArray(boothIds)) {
        return sendResponse(res, { success: false, error: 'groupId and boothIds[] are required', status: 400 });
      }
      const repo = new GroupBoothRepository(req.tenantSequelize);
      const mapped = await repo.mapGroupToBooths(groupId, boothIds);
      return sendResponse(res, { data: { mapped: mapped.length }, message: 'Booths mapped to group' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to map group to booths', status: 500 });
    }
  }

  static async unmapGroupFromBooth(req, res) {
    try {
      const { groupId, boothId } = req.params;
      const repo = new GroupBoothRepository(req.tenantSequelize);
      const removed = await repo.unmapGroupFromBooth(groupId, boothId);
      return sendResponse(res, { data: { removed }, message: 'Booth unmapped from group' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to unmap booth', status: 500 });
    }
  }

  static async getGroupBooths(req, res) {
    try {
      const { groupId } = req.params;
      const repo = new GroupBoothRepository(req.tenantSequelize);
      const rows = await repo.getGroupBooths(groupId);
      return sendResponse(res, { data: rows });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch group booths', status: 500 });
    }
  }

  static async listBoothAssignmentsByShift(req, res) {
    try {
      const { shiftId } = req.query;
      if (!shiftId) {
        return sendResponse(res, { success: false, error: 'shiftId is required', status: 400 });
      }
      const repo = new GroupBoothRepository(req.tenantSequelize);
      const rows = await repo.listBoothAssignmentsByShift(shiftId);
      // Normalize shape to frontend expectation
      const result = rows.map((r) => ({
        booth_id: r.booth_id,
        operator_group_id: r.operator_group_id,
        OperatorGroup: r.OperatorGroup,
      }));
      return sendResponse(res, { data: result });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch booth assignments', status: 500 });
    }
  }
}




