import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from './logger.util.js';
import { tokenTimeToLive } from '../constants.js';
// import { getMasterSequelize } from '../config/db.config.js';
// import { MasterRepository } from '../repository/master.repository.js';
// import { getTenantDbModels } from '../controller/helper/tenantDb.helper.js';

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
        bunkId: payload.bunkId || null,
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
    if (!payload.userId) {
      logger.error(`[auth.util]-[generateRefreshToken]: Missing userId`);
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      logger.error(`[auth.util]-[generateRefreshToken]: JWT_REFRESH_SECRET is undefined`);
    }
    const token = jwt.sign(
      { userId: payload.userId, email: payload.email, bunkId: payload.bunkId || null },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: tokenTimeToLive.REFRESH_TOKEN_COOKIE }
    );
    logger.info(`[auth.util]-[generateRefreshToken]: Generated token: ${token}`);
    return token;
  } catch (error) {
    logger.error(`[auth.util]-[generateRefreshToken]: ${error.message}`);
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
    //logger.info(`[auth.util]-[verifyRefreshToken]: Verifying token: ${token}`);
    //logger.info(`[auth.util]-[verifyRefreshToken]: JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? 'Defined' : 'Undefined'}`);
    if (!token) {
      throw new Error('No token provided');
    }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    //logger.info(`[auth.util]-[verifyRefreshToken]: Decoded: ${JSON.stringify(decoded)}`);
    return decoded;
  } catch (error) {
    //logger.error(`[auth.util]-[verifyRefreshToken]: ${error.message}`);
    throw error;
  }
};