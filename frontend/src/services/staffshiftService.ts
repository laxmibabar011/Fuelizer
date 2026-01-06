import apiClient from "./apiClient";

class StaffShiftService {
  // Operator onboarding (creates User, UserDetails, Operator)
  async onboardOperator(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return apiClient.post("api/tenant/staffshift/operators/onboard", payload);
  }

  // Operators CRUD
  async createOperator(payload: any) {
    return apiClient.post("api/tenant/staffshift/operators", payload);
  }

  async listOperators(options?: { includeInactive?: boolean }) {
    const params = new URLSearchParams();
    if (options?.includeInactive) params.set("includeInactive", "true");
    const qs = params.toString();
    const url = qs
      ? `api/tenant/staffshift/operators?${qs}`
      : "api/tenant/staffshift/operators";
    return apiClient.get(url);
  }

  // Managers (Fuel Admins)
  async listManagers() {
    return apiClient.get("api/tenant/staffshift/admins");
  }

  async listAvailableManagerShifts() {
    return apiClient.get("api/tenant/staffshift/manager-shifts/available");
  }

  async assignManagerShift(payload: {
    user_id: string;
    shift_id: string | number;
  }) {
    return apiClient.post(
      "api/tenant/staffshift/manager-shifts/assign",
      payload
    );
  }

  async unassignManagerShift(payload: {
    user_id: string;
    shift_id: string | number;
  }) {
    return apiClient.post(
      "api/tenant/staffshift/manager-shifts/unassign",
      payload
    );
  }

  async listAvailableOperators() {
    return apiClient.get("api/tenant/staffshift/operators/available");
  }

  async getOperatorById(id: number | string) {
    return apiClient.get(`api/tenant/staffshift/operators/${id}`);
  }

  async updateOperator(id: number | string, payload: any) {
    return apiClient.put(`api/tenant/staffshift/operators/${id}`, payload);
  }

  async deleteOperator(id: number | string) {
    return apiClient.delete(`api/tenant/staffshift/operators/${id}`);
  }

  // Shifts CRUD
  async createShift(payload: any) {
    return apiClient.post("api/tenant/staffshift/shifts", payload);
  }

  async listShifts() {
    return apiClient.get("api/tenant/staffshift/shifts");
  }

  async getShiftById(id: number | string) {
    return apiClient.get(`api/tenant/staffshift/shifts/${id}`);
  }

  async updateShift(id: number | string, payload: any) {
    return apiClient.put(`api/tenant/staffshift/shifts/${id}`, payload);
  }

  async deleteShift(id: number | string) {
    return apiClient.delete(`api/tenant/staffshift/shifts/${id}`);
  }

  // Shift assignments (use user_id)
  async createShiftAssignment(payload: {
    date: string;
    shift_id: number | string;
    user_id: string;
    assigned_by?: string;
  }) {
    return apiClient.post("api/tenant/staffshift/shift-assignments", payload);
  }

  async listShiftAssignments(date: string, shiftId?: number | string) {
    const qs = new URLSearchParams({ date });
    if (shiftId) qs.set("shiftId", String(shiftId));
    return apiClient.get(
      `api/tenant/staffshift/shift-assignments?${qs.toString()}`
    );
  }

  async updateShiftAssignment(id: number | string, payload: any) {
    return apiClient.put(
      `api/tenant/staffshift/shift-assignments/${id}`,
      payload
    );
  }

  async deleteShiftAssignment(id: number | string) {
    return apiClient.delete(`api/tenant/staffshift/shift-assignments/${id}`);
  }

  async getOperatorsByShift(shiftId: string | number, date?: string) {
    const url = date
      ? `api/tenant/staffshift/shifts/${shiftId}/operators?date=${date}`
      : `api/tenant/staffshift/shifts/${shiftId}/operators`;
    return apiClient.get(url);
  }

  // ===== GROUPS & SCHEDULING (stubs to be wired to backend) =====
  async listGroups(shiftId?: string | number) {
    const url = shiftId
      ? `api/tenant/staffshift/operator-groups?shiftId=${shiftId}`
      : "api/tenant/staffshift/operator-groups";
    return apiClient.get(url);
  }

  async createGroup(payload: {
    name: string;
    cashierId: string;
    shiftId: string;
  }) {
    return apiClient.post("api/tenant/staffshift/operator-groups", payload);
  }

  async deleteGroup(groupId: string | number) {
    return apiClient.delete(`api/tenant/staffshift/operator-groups/${groupId}`);
  }

  async setGroupAttendants(groupId: string | number, userIds: string[]) {
    return apiClient.post(
      `api/tenant/staffshift/operator-groups/${groupId}/attendants`,
      { userIds }
    );
  }

  async getGroupAttendants(groupId: string | number) {
    return apiClient.get(
      `api/tenant/staffshift/operator-groups/${groupId}/attendants`
    );
  }

  async mapGroupToBooths(groupId: string | number, boothIds: number[]) {
    return apiClient.post(
      `api/tenant/staffshift/operator-groups/${groupId}/booths`,
      { boothIds }
    );
  }

  async getGroupBooths(groupId: string | number) {
    return apiClient.get(
      `api/tenant/staffshift/operator-groups/${groupId}/booths`
    );
  }

  async listBoothAssignments(shiftId: string | number) {
    return apiClient.get(`api/tenant/staffshift/booth-assignments`, {
      params: { shiftId },
    });
  }

  // ===== POS CONTEXT METHODS =====
  async getCashierPOSContext() {
    return apiClient.get("api/tenant/staffshift/pos/context");
  }

  async validatePOSAccess(params?: {
    nozzleId?: string | number;
    operatorId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.nozzleId)
      searchParams.set("nozzleId", params.nozzleId.toString());
    if (params?.operatorId) searchParams.set("operatorId", params.operatorId);

    const queryString = searchParams.toString();
    const url = queryString
      ? `api/tenant/staffshift/pos/validate-access?${queryString}`
      : "api/tenant/staffshift/pos/validate-access";

    return apiClient.get(url);
  }
}

export default new StaffShiftService();
