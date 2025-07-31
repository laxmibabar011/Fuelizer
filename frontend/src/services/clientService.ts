import apiClient from "./apiClient";

class ClientService {
  async listClients() {
    // The token is now added automatically by the apiClient interceptor
    return apiClient.get("api/superadmin/clients");
  }

  async createClient(form: any) {
    // The token is now added automatically by the apiClient interceptor
    return apiClient.post("api/master/clients/register", form);
  }
}

export default new ClientService();
