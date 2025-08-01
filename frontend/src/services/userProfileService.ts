import authService from "./authService";
// import creditService from "./creditService";
import { AuthUser } from "../context/AuthContext";

export async function fetchUserProfile(authUser: AuthUser) {
  if (!authUser?.email) throw new Error("No user email found.");

  // Use /me endpoint for all user types (super admin and tenant users)
  const res = await authService.getMe();
  if (!res.data.success)
    throw new Error(res.data.message || "Failed to load user details.");
  return res.data.data;

  // Note: Previously used getUserDetailsByEmail for tenant users, but now using /me for all users
  // if (authUser.role === "super_admin") {
  //   const res = await authService.getMe();
  //   return res.data.data;
  // } else {
  //   const res = await creditService.getUserDetailsByEmail(authUser.email);
  //   if (!res.data.success) throw new Error(res.data.message || "Failed to load user details.");
  //   return res.data.data;
  // }
}
