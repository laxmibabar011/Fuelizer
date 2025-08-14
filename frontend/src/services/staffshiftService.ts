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

  // Shift assignments (today-only can be handled by passing today's date)
  async createShiftAssignment(payload: {
    date: string;
    shift_id: number;
    operator_id: number;
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
}

export default new StaffShiftService();
