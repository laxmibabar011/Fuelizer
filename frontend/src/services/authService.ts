import apiClient from "./apiClient";

class AuthService {
  // Super admin login (2 parameters: email, password)
  async superAdminLogin(email: string, password: string) {
    return apiClient.post("api/auth/super-admin/login", { email, password });
  }

  // Tenant user login (3 parameters: email, password, clientId)
  async tenantLogin(email: string, password: string, clientId: string) {
    return apiClient.post("api/auth/login", { email, password, clientId });
  }

  async logout() {
    return apiClient.post("api/auth/logout", {});
  }

  async refresh() {
    return apiClient.post("api/auth/refresh", {});
  }

  async getMe() {
    return apiClient.get("api/auth/me");
  }

  async forgotPassword(email: string, clientId?: string) {
    const payload: { email: string; clientId?: string } = { email };
    if (clientId) {
      payload.clientId = clientId;
    }
    return apiClient.post("api/auth/forgot-password", payload);
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string,
    clientId?: string
  ) {
    const payload: {
      email: string;
      otp: string;
      newPassword: string;
      confirmPassword: string;
      clientId?: string;
    } = { email, otp, newPassword, confirmPassword };

    if (clientId) {
      payload.clientId = clientId;
    }

    return apiClient.post("api/auth/reset-password", payload);
  }

  handleLogoutNavigation() {
    window.location.href = "/login";
  }
}

export default new AuthService();
