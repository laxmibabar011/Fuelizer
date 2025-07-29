import { verifyToken } from '../util/auth.util.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const user = verifyToken(token);
    req.user = {
      userId: user.userId,
      email: user.email,
      role: user.role || null,
      roleId: user.roleId || null,
      clientId: user.clientId || null,
      tenantDbName: user.tenantDbName || null
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  const userRole = req.user.role || (req.user.roleId ? 'tenant_user' : null);
  if (!userRole || !roles.includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  next();
};