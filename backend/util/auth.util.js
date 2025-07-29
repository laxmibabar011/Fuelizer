import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from './logger.util.js';
import { tokenTimeToLive } from '../constants.js';
import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { getTenantDbModels } from '../controller/helper/tenantDb.helper.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload) => {
  try {
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || null,
        roleId: payload.roleId || null,
        clientId: payload.clientId || null,
        tenantDbName: payload.tenantDbName || null
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenTimeToLive.ACCESS_TOKEN_COOKIE }
    );
    return token;
  } catch (error) {
    logger.error(`[auth.util]-[generateAccessToken]: ${error.message}`);
    throw new Error('Error generating access token: ' + error.message);
  }
};

export const generateRefreshToken = (payload) => {
  try {
    logger.info(`[auth.util]-[generateRefreshToken]: Payload: ${JSON.stringify(payload)}`);
    if (!payload.userId || !payload.clientId) {
      throw new Error('Missing userId or clientId in payload');
    }
    const token = jwt.sign(
      { userId: payload.userId, email: payload.email, clientId: payload.clientId || null },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: tokenTimeToLive.REFRESH_TOKEN_COOKIE }
    );
    logger.info(`[auth.util]-[generateRefreshToken]: Generated token: ${token}`);
    return token;
  } catch (error) {
    logger.error(`[auth.util]-[generateRefreshToken]: ${error.message}`);
    throw new Error('Error generating refresh token: ' + error.message);
  }
};

export const verifyToken = (token) => {
  try {
    logger.info(`[auth.util]-[verifyToken]: Verifying token`);
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error(`[auth.util]-[verifyToken]: ${error.message}`);
    throw error;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    logger.info(`[auth.util]-[verifyRefreshToken]: Verifying token: ${token}`);
    logger.info(`[auth.util]-[verifyRefreshToken]: JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? 'Defined' : 'Undefined'}`);
    if (!token) {
      throw new Error('No token provided');
    }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    logger.info(`[auth.util]-[verifyRefreshToken]: Decoded: ${JSON.stringify(decoded)}`);
    return decoded;
  } catch (error) {
    logger.error(`[auth.util]-[verifyRefreshToken]: ${error.message}`);
    throw error;
  }
};

export const getCurrentUser = async (userId, clientId, tenantDbName) => {
  try {
    let user;
    if (clientId && tenantDbName) {
      // Tenant user
      const { User, Role, UserDetails } = await getTenantDbModels(tenantDbName);
      user = await User.findByPk(userId, { include: ['Role', 'UserDetails'] });
      if (!user) {
        throw new Error('User not found');
      }
      logger.info(`[auth.util]-[getCurrentUser]: Tenant user fetched: ${user.email}`);
      return {
        userId: user.user_id,
        email: user.email,
        role: user.Role?.name || '',
        clientId,
        details: user.UserDetails || {}
      };
    } else {
      // Super-admin
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      user = await masterRepo.getSuperAdminUserById(userId);
      if (!user) {
        throw new Error('Super-admin not found');
      }
      logger.info(`[auth.util]-[getCurrentUser]: Super-admin fetched: ${user.email}`);
      return {
        userId: user.id,
        email: user.email,
        role: user.role
      };
    }
  } catch (error) {
    logger.error(`[auth.util]-[getCurrentUser]: ${error.message}`);
    throw new Error('Error getting current user: ' + error.message);
  }
};