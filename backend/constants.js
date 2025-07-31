export const StatusCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

export const tokenTimeToLive = {
  ACCESS_TOKEN_COOKIE: 15 * 60 * 1000, // 15 minutes for access token
  REFRESH_TOKEN_COOKIE: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
};

// Enum for all user roles in the system
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  FUEL_ADMIN: "fuel-admin",
  PARTNER: "partner",
  // Add more roles as needed
};