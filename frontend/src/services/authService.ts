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
  // Forgot password: send OTP to email
  async forgotPassword(email: string) {
    return apiClient.post("/forgot-password", { email });
  }

  // Reset password: verify OTP and set new password
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ) {
    return apiClient.post("/reset-password", {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
  }
}

export default new AuthService();
