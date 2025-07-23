import apiClient from "./apiClient";

class AuthService {
  async login(email: string, password: string) {
    return apiClient.post("/login", { email, password });
  }

  async logout() {
    return apiClient.post("/logout", {});
  }

  async refresh() {
    // This call is used by the interceptor and doesn't need a token
    return apiClient.post("/refresh", {});
  }

  async getMe() {
    // No more token parameter or manual header!
    return apiClient.get("/me");
  }

  // Helper to allow logout navigation from outside React components
  handleLogoutNavigation() {
    // This forces a reload and redirection, effectively logging the user out.
    window.location.href = '/signin';
  }
}

export default new AuthService();