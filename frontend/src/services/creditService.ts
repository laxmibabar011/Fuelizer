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
  isApprover?: boolean;
}

class CreditService {
  async onboardPartner(data: CreditPartnerData, token: string) {
    return apiClient.post("/tenant/credit/onboard", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAllPartners(token: string) {
    return apiClient.get("/tenant/credit/partners", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getPartnerById(id: string, token: string) {
    return apiClient.get(`/tenant/credit/partners/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updatePartnerStatus(id: number, status: string, token: string) {
    return apiClient.patch(`/tenant/credit/partners/${id}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export default new CreditService(); 