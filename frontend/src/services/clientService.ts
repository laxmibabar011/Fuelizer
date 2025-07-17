import apiClient from "./apiClient";

class ClientService {
  async listClients(accessToken: string) {
    return apiClient.get("/superadmin/clients", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async createClient(form: any, accessToken: string) {
    return apiClient.post("/clients/register", form, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}

export default new ClientService(); 