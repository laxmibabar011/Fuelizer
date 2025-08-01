import { verifyToken } from '../util/auth.util.js';
export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const user = verifyToken(token);
    
    // 🔍 DEBUG: Log what verifyToken returns
    console.log('🔍 JWT Verification Result:', user);
    
    req.user = {
      userId: user.userId,
      email: user.email,
      role: user.role || null,
      roleId: user.roleId || null,
      clientId: user.clientId || null,
      tenantDbName: user.tenantDbName || null
    };
    
    // 🔍 DEBUG: Log what gets set to req.user
    console.log('🔍 req.user after auth:', req.user);
    
    next();
  } catch (err) {
    console.log('❌ JWT Verification Error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  const userRole = req.user.role || (req.user.roleId ? 'tenant_user' : null);
  
  // 🔍 DEBUG: Log authorization details
  console.log('🔍 Authorization Check:');
  console.log('  - Required roles:', roles);
  console.log('  - req.user.role:', req.user.role);
  console.log('  - req.user.roleId:', req.user.roleId);
  console.log('  - Calculated userRole:', userRole);
  console.log('  - Authorization result:', roles.includes(userRole));
  
  if (!userRole || !roles.includes(userRole)) {
    console.log('❌ AUTHORIZATION FAILED');
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  console.log('✅ AUTHORIZATION PASSED');
  next();
};