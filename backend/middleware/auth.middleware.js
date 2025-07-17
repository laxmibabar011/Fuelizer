import { StatusCode } from "../constants.js";
import { verifyToken } from '../util/auth.util.js';
import dotenv from 'dotenv';
dotenv.config();

export const authenticate = (req, res, next) => {
  // Only get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};