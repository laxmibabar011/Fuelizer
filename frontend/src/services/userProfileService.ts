import authService from "./authService";
import creditService from "./creditService";
import { AuthUser } from "../context/AuthContext";

export async function fetchUserProfile(authUser: AuthUser) {
  if (!authUser?.email) throw new Error("No user email found.");
  if (authUser.role === "super_admin") {
    // Use /me for superadmin
    const res = await authService.getMe();
    return res.data.data;
  } else {
    // Use userdetails endpoint for all other roles by email
    const res = await creditService.getUserDetailsByEmail(authUser.email);
    if (!res.data.success) throw new Error(res.data.message || "Failed to load user details.");
    return res.data.data;
  }
} 