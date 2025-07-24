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

   async forgotPassword(email: string) {
    return apiClient.post("/forgot-password", { email });
  }

  // Reset password: verify OTP and set new password
  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string) {
    return apiClient.post("/reset-password", { email, otp, newPassword, confirmPassword });
  }

  // Helper to allow logout navigation from outside React components
  handleLogoutNavigation() {
    // This forces a reload and redirection, effectively logging the user out.
    window.location.href = '/signin';
  }
}

export default new AuthService();