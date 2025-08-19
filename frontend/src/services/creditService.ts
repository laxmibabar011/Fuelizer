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
    return apiClient.post("api/tenant/credit/onboard", data);
  }

  async getAllPartners() {
    return apiClient.get("api/tenant/credit/partners");
  }

  async getPartnerById(id: string) {
    return apiClient.get(`api/tenant/credit/partners/${id}`);
  }

  async updatePartnerStatus(id: number, status: string) {
    return apiClient.patch(`api/tenant/credit/partners/${id}/status`, {
      status,
    });
  }

  async updateCreditLimit(id: string | number, creditLimit: number) {
    return apiClient.patch(`api/tenant/credit/partners/${id}/credit-limit`, {
      creditLimit,
    });
  }

  async addVehicles(partnerId: string, vehicles: any[]) {
    return apiClient.post(`api/tenant/credit/partners/${partnerId}/vehicles`, {
      vehicles,
    });
  }

  async getVehicles(partnerId: string) {
    return apiClient.get(`api/tenant/credit/partners/${partnerId}/vehicles`);
  }

  async updateVehicle(vehicleId: string, data: any) {
    return apiClient.put(`api/tenant/credit/vehicles/${vehicleId}`, data);
  }

  async setVehicleStatus(vehicleId: string, status: string) {
    return apiClient.patch(`api/tenant/credit/vehicles/${vehicleId}/status`, {
      status,
    });
  }

  async deleteVehicle(vehicleId: string) {
    return apiClient.delete(`api/tenant/credit/vehicles/${vehicleId}`);
  }

  // Note: userdetails endpoints are not used anymore, using /me endpoint instead
  // async getUserDetails(userId: string) {
  //   return apiClient.get(`api/tenant/userdetails/${userId}`);
  // }

  // async getUserDetailsByEmail(email: string) {
  //   return apiClient.get(`api/tenant/userdetails/by-email/${encodeURIComponent(email)}`);
  // }
}

export default new CreditService();
