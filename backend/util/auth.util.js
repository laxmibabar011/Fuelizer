import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from './logger.util.js';
import { tokenTimeToLive } from '../constants.js';
import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { USER_ROLES } from '../constants.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateAccessToken = (user) => {
  try {
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        client_id: user.client_id,
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

export const generateRefreshToken = (user) => {
  try {
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        client_id: user.client_id,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: tokenTimeToLive.REFRESH_TOKEN_COOKIE }
    );
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
    logger.info(`[auth.util]-[verifyRefreshToken]: Verifying refresh token`);
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    logger.error(`[auth.util]-[verifyRefreshToken]: ${error.message}`);
    throw error;
  }
};

export const getCurrentUser = async (id) => {
  try {
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const user = await masterRepo.getMasterUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    logger.info(`[auth.util]-[getCurrentUser]-[Info]: User fetched successfully: ${JSON.stringify(user)}`);
    let clientDetails = null;
    if (user.client_id) {
      clientDetails = await masterRepo.getClientById(user.client_id);
    }
    if (user.role !== USER_ROLES.SUPER_ADMIN && clientDetails) {
      return {
        id: user.id || '',
        email: user.email || '',
        role: user.role || '',
        clientId: clientDetails.id || '',
        clientKey: clientDetails.client_key || '',
        clientName: clientDetails.client_name || '',
        clientOwnerName: clientDetails.client_owner_name || '',
        clientAddress: clientDetails.client_address || '',
        clientCity: clientDetails.client_city || '',
        clientState: clientDetails.client_state || '',
        clientCountry: clientDetails.client_country || '',
        clientPincode: clientDetails.client_pincode || '',
        clientPhone: clientDetails.client_phone || '',
        clientEmail: clientDetails.client_email || '',
        clientGstNumber: clientDetails.gst_number || '',
        clientDbName: clientDetails.db_name || '',
      };
    } else {
      return {
        id: user.id || '',
        email: user.email || '',
        role: user.role || '',
      };
    }
  } catch (error) {
    logger.error(`[auth.util]-[getCurrentUser]-[Error]: ${error.message}`);
    throw new Error('Error getting current user: ' + error.message);
  }
};