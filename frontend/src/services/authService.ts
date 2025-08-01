import apiClient from "./apiClient";

class AuthService {
  // Super admin login (2 parameters: email, password)
  async superAdminLogin(email: string, password: string) {
    return apiClient.post("api/auth/super-admin/login", { email, password });
  }

  // Tenant user login (3 parameters: email, password, bunkId)
  async tenantLogin(email: string, password: string, bunkId: string) {
    return apiClient.post("api/auth/login", { email, password, bunkId });
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

  async forgotPassword(email: string, bunkId?: string) {
    const payload: { email: string; bunkId?: string } = { email };
    if (bunkId) {
      payload.bunkId = bunkId;
    }
    return apiClient.post("api/auth/forgot-password", payload);
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string,
    bunkId?: string
  ) {
    const payload: {
      email: string;
      otp: string;
      newPassword: string;
      confirmPassword: string;
      bunkId?: string;
    } = { email, otp, newPassword, confirmPassword };

    if (bunkId) {
      payload.bunkId = bunkId;
    }

    return apiClient.post("api/auth/reset-password", payload);
  }

  handleLogoutNavigation() {
    window.location.href = "/login";
  }
}

export default new AuthService();
