import apiClient from "./apiClient";

class AuthService {
  async login(email: string, password: string) {
    return apiClient.post("/login", { email, password });
  }

  async logout() {
    return apiClient.post("/logout", {});
  }

  async refresh() {
    return apiClient.post("/refresh", {});
  }

  async getMe(token: string) {
    return apiClient.get("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export default new AuthService(); 