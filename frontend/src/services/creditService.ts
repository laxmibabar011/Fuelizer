import apiClient from "./apiClient";

interface CreditPartnerData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  creditLimit: number;
  userName: string;
  userEmail: string;
  userPassword: string;
}

class CreditService {
  async onboardPartner(data: CreditPartnerData) {
    return apiClient.post("/tenant/credit/onboard", data);
  }

  async getAllPartners() {
    return apiClient.get("/tenant/credit/partners");
  }

  async getPartnerById(id: string) {
    return apiClient.get(`/tenant/credit/partners/${id}`);
  }

  async updatePartnerStatus(id: number, status: string) {
    return apiClient.patch(`/tenant/credit/partners/${id}/status`, { status });
  }

  async addVehicles(partnerId: string, vehicles: any[]) {
    return apiClient.post(`/tenant/credit/partners/${partnerId}/vehicles`, { vehicles });
  }

  async getVehicles(partnerId: string) {
    return apiClient.get(`/tenant/credit/partners/${partnerId}/vehicles`);
  }

  async updateVehicle(vehicleId: string, data: any) {
    return apiClient.put(`/tenant/credit/vehicles/${vehicleId}`, data);
  }

  async setVehicleStatus(vehicleId: string, status: string) {
    return apiClient.patch(`/tenant/credit/vehicles/${vehicleId}/status`, { status });
  }

  async deleteVehicle(vehicleId: string) {
    return apiClient.delete(`/tenant/credit/vehicles/${vehicleId}`);
  }
}

export default new CreditService();