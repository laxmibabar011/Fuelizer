import { getMasterSequelize } from '../config/db.config.js';
import { getTenantDbModels } from '../controller/helper/tenantDb.helper.js';
import { MasterRepository } from '../repository/master.repository.js';
import { comparePassword, generateAccessToken, generateRefreshToken, hashPassword ,verifyRefreshToken } from '../util/auth.util.js';
import { sendResponse } from '../util/response.util.js';
import DateUtil from '../util/date.util.js';
import { logger } from '../util/logger.util.js';
import { sendOtpEmail } from '../util/mailer.util.js';
import { Sequelize } from 'sequelize';
const { Op } = Sequelize;


export default class AuthController {
  static async login(req, res) {
    try {
      const { email, password, bunkId } = req.body;
      if (!email || !password || !bunkId) {
        return sendResponse(res, { success: false, error: 'Missing credentials or bunkId', message: 'Login failed', status: 400 });
      }
 
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      const client = await masterRepo.findClientById(bunkId);
      if (!client || !client.is_active) {
        return sendResponse(res, { success: false, error: 'Invalid or inactive bunkId', message: 'Login failed', status: 404 });
      }
 
      const { tenantSequelize, User, RefreshToken, Role } = await getTenantDbModels(client.db_name);
      const user = await User.findOne({ where: { email }, include: ['Role'] });
      if (!user) {
        return sendResponse(res, { success: false, error: 'User not found', message: 'Login failed', status: 404 });
      }
 
      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        return sendResponse(res, { success: false, error: 'Invalid password', message: 'Login failed', status: 401 });
      }
 
      const accessToken = generateAccessToken({ userId: user.user_id, email: user.email, role: user.Role?.name, bunkId, tenantDbName: client.db_name });
      const refreshToken = generateRefreshToken({ userId: user.user_id, bunkId });
 
      await RefreshToken.create({
        user_id: user.user_id,
        token: refreshToken,
        expires_at: DateUtil.nowPlusMs(7 * 24 * 60 * 60 * 1000), // 7 days
        bunk_id: bunkId
      });
 
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
 
      logger.info(`[AuthController]-[login]: User ${email} logged in successfully (bunkId: ${bunkId})`);
      return sendResponse(res, {
        data: {
          accessToken,
          user: { userId: user.user_id, email: user.email, role: user.Role?.name || null }
        },
        message: 'Login successful'
      });
    } catch (err) {
      logger.error(`[AuthController]-[login]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Login error' });
    }
  }

  static async superAdminLogin(req, res) {
    try {
      const { email, password } = req.body;
      logger.info(`[AuthController]-[superAdminLogin]: Attempting login for email: ${email}`);
      if (!email || !password) {
        return sendResponse(res, { success: false, error: 'Email and password required', message: 'Super-admin login failed', status: 400 });
      }
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      const superAdmin = await masterRepo.getSuperAdminByEmail(email);
      if (!superAdmin) {
        return sendResponse(res, { success: false, error: 'Invalid credentials', message: 'Super-admin login failed', status: 401 });
      }
      const isPasswordValid = await comparePassword(password, superAdmin.password);
      if (!isPasswordValid) {
        return sendResponse(res, { success: false, error: 'Invalid credentials', message: 'Super-admin login failed', status: 401 });
      }
      const accessToken = generateAccessToken({
        userId: superAdmin.id,
        email: superAdmin.email,
        role: 'super_admin'
      });
      const refreshToken = generateRefreshToken({
        userId: superAdmin.id,
        email: superAdmin.email
      });
      logger.info(`[AuthController]-[superAdminLogin]: Generated refreshToken: ${refreshToken}`);
      await masterRepo.updateSuperAdminRefreshToken(superAdmin.id, {
        refresh_token: refreshToken,
        refresh_token_expires_at: DateUtil.nowPlusMs(7 * 24 * 60 * 60 * 1000),
        refresh_token_revoked: false
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
      logger.info(`[AuthController]-[superAdminLogin]: Super-admin ${superAdmin.id} logged in`);
      return sendResponse(res, {
        data: {
          accessToken,
          user: { userId: superAdmin.id, email: superAdmin.email, role: 'super_admin' }
        },
        message: 'Super-admin login successful',
        status: 200
      });
    } catch (err) {
      logger.error(`[AuthController]-[superAdminLogin]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Super-admin login error', status: 500 });
    }
  }
  
  static async refresh(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      //logger.info(`[AuthController]-[refresh]: Received refreshToken: ${refreshToken}`);
      if (!refreshToken) {
        return sendResponse(res, { success: false, error: 'Refresh token required', message: 'Token refresh failed', status: 400 });
      }
      const payload = verifyRefreshToken(refreshToken);
      logger.info(`[AuthController]-[refresh]: Token payload: ${JSON.stringify(payload)}`);
      if (!payload || !payload.userId) {
        return sendResponse(res, { success: false, error: 'Invalid refresh token', message: 'Token refresh failed', status: 401 });
      }
      let user, newAccessToken, newRefreshToken;
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      if (payload.bunkId) {
        // Tenant user
        const client = await masterRepo.findClientById(payload.bunkId);
        if (!client || !client.is_active) {
          return sendResponse(res, { success: false, error: 'Invalid or inactive client', message: 'Token refresh failed', status: 404 });
        }
        
        // Get tenant models with better error handling
        let tenantSequelize, User, RefreshToken, Role;
        try {
          const models = await getTenantDbModels(client.db_name);
          tenantSequelize = models.tenantSequelize;
          User = models.User;
          RefreshToken = models.RefreshToken;
          Role = models.Role;
        } catch (dbErr) {
          logger.error(`[AuthController]-[refresh]: Database connection error for ${client.db_name}: ${dbErr.message}`);
          return sendResponse(res, { success: false, error: 'Database connection failed', message: 'Token refresh failed', status: 500 });
        }
        const tokenRecord = await RefreshToken.findOne({
          where: { token: refreshToken, user_id: payload.userId, revoked: false, expires_at: { [Op.gt]: DateUtil.nowDate() } }
        });
        if (!tokenRecord) {
          return sendResponse(res, { success: false, error: 'Invalid or revoked refresh token', message: 'Token refresh failed', status: 401 });
        }
        // First get user without include to avoid cache issues
        user = await User.findByPk(payload.userId);
        if (!user) {
          return sendResponse(res, { success: false, error: 'User not found', message: 'Token refresh failed', status: 404 });
        }
        
        // Then get role separately to avoid cache lookup issues
        let roleName = null;
        try {
          const role = await Role.findByPk(user.role_id);
          roleName = role?.name;
        } catch (roleErr) {
          logger.warn(`[AuthController]-[refresh]: Could not fetch role for user ${user.user_id}: ${roleErr.message}`);
          // Continue without role name, will use roleId
        }
        
        // Use roleId as fallback if role name is not available
        const finalRole = roleName || `role_${user.role_id}`;
        newAccessToken = generateAccessToken({ userId: user.user_id, email: user.email, role: finalRole, roleId: user.role_id, bunkId: payload.bunkId, tenantDbName: client.db_name });
        newRefreshToken = generateRefreshToken({ userId: user.user_id, email: user.email, bunkId: payload.bunkId });
        await RefreshToken.update({ revoked: true }, { where: { token: refreshToken } });
        await RefreshToken.create({
          user_id: user.user_id,
          token: newRefreshToken,
          expires_at: DateUtil.nowPlusMs(7 * 24 * 60 * 60 * 1000),
          bunk_id: payload.bunkId
        });
      } else {
        // Super-admin
        const superAdmin = await masterRepo.getSuperAdminById(payload.userId);
        if (!superAdmin || superAdmin.refresh_token !== refreshToken || superAdmin.refresh_token_revoked || superAdmin.refresh_token_expires_at < DateUtil.nowDate()) {
          return sendResponse(res, { success: false, error: 'Invalid or revoked refresh token', message: 'Token refresh failed', status: 401 });
        }
        user = superAdmin;
        newAccessToken = generateAccessToken({ userId: user.id, email: user.email, role: 'super_admin' });
        newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email });
        await masterRepo.updateSuperAdminRefreshToken(user.id, {
          refresh_token: newRefreshToken,
          refresh_token_expires_at: DateUtil.nowPlusMs(7 * 24 * 60 * 60 * 1000),
          refresh_token_revoked: false
        });
      }
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
      logger.info(`[AuthController]-[refresh]: Token refreshed for user ${user.user_id || user.id}`);
      return sendResponse(res, {
        data: { accessToken: newAccessToken, user: { userId: user.user_id || user.id, email: user.email, roleId: user.role_id, role: user.role } },
        message: 'Token refreshed successfully',
        status: 200
      });
    } catch (err) {
      logger.error(`[AuthController]-[refresh]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Refresh error', status: 500 });
    }
  }

  static async logout(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      //logger.info(`[AuthController]-[logout]: Received refreshToken: ${refreshToken}`);
      if (!refreshToken) {
        return sendResponse(res, { success: false, error: 'Refresh token required', message: 'Logout failed', status: 400 });
      }
      const payload = verifyRefreshToken(refreshToken);
      logger.info(`[AuthController]-[logout]: Token payload: ${JSON.stringify(payload)}`);
      if (!payload || !payload.userId) {
        return sendResponse(res, { success: false, error: 'Invalid refresh token', message: 'Logout failed', status: 401 });
      }
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      if (payload.bunkId) {
        const client = await masterRepo.findClientById(payload.bunkId);
        if (!client || !client.is_active) {
          return sendResponse(res, { success: false, error: 'Invalid or inactive client', message: 'Logout failed', status: 404 });
        }
        const { tenantSequelize, RefreshToken } = await getTenantDbModels(client.db_name);
        await RefreshToken.update({ revoked: true }, {
          where: { token: refreshToken, user_id: payload.userId, expires_at: { [Op.gt]: DateUtil.nowDate() } }
        });
      } else {
        await masterRepo.updateSuperAdminRefreshToken(payload.userId, {
          refresh_token: null,
          refresh_token_expires_at: null,
          refresh_token_revoked: true
        });
      }
      res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
      logger.info(`[AuthController]-[logout]: User ${payload.userId} logged out`);
      return sendResponse(res, { message: 'Logged out successfully', status: 200 });
    } catch (err) {
      logger.error(`[AuthController]-[logout]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Logout failed', status: 500 });
    }
  }

  static async getCurrentUser(req, res) {
    try {
      const { userId, bunkId, tenantDbName, role } = req.user;
      let userProfile;

      if (bunkId && tenantDbName) {
        // Tenant user
        const { User } = await getTenantDbModels(tenantDbName);
        const user = await User.findByPk(userId, { include: ['Role', 'UserDetails'] });
        if (!user) {
          return sendResponse(res, { success: false, error: 'User not found', message: 'Failed to fetch current user', status: 404 });
        }
        userProfile = {
          userId: user.user_id,
          email: user.email,
          role: user.Role?.name,
          bunkId,
          details: user.UserDetails
        };
      } else {
        // Super-admin
        const masterSequelize = getMasterSequelize();
        const masterRepo = new MasterRepository(masterSequelize);
        const user = await masterRepo.getSuperAdminById(userId); // Fixed method name
        if (!user) {
          return sendResponse(res, { success: false, error: 'Super-admin not found', message: 'Failed to fetch current user', status: 404 });
        }
        userProfile = {
          userId: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          phone: user.phone,
          city: user.city,
          state: user.state,
          country: user.country,
          postal_code: user.postal_code,
          gstin: user.gstin
        };
      }

      logger.info(`[AuthController]-[getCurrentUser]: Profile fetched for user ${userId}`);
      return sendResponse(res, { data: userProfile, message: 'Current user fetched' });
    } catch (err) {
      logger.error(`[AuthController]-[getCurrentUser]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch current user' });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email, bunkId } = req.body;
      if (!email) {
        return sendResponse(res, { success: false, error: 'Email required', message: 'Email required', status: 400 });
      }

      let user, userId, targetClientId;
      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);

      if (bunkId) {
        // Tenant user
        const client = await masterRepo.findClientById(bunkId);
        if (!client || !client.is_active) {
          return sendResponse(res, { success: false, error: 'Invalid or inactive client', message: 'User not found', status: 404 });
        }
        const { User } = await getTenantDbModels(client.db_name);
        user = await User.findOne({ where: { email } });
        if (!user) {
          return sendResponse(res, { success: false, error: 'User not found', message: 'User not found', status: 404 });
        }
        userId = user.user_id;
        targetClientId = bunkId;
      } else {
        // Super-admin
        user = await masterRepo.getSuperAdminByEmail(email); // Fixed method name
        if (!user) {
          return sendResponse(res, { success: false, error: 'Super-admin not found', message: 'User not found', status: 404 });
        }
        userId = user.id.toString();
        targetClientId = null;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires_at = DateUtil.nowPlusMs(10 * 60 * 1000); // 10 min
      await masterRepo.createPasswordReset({ user_id: userId, bunk_id: targetClientId, otp, expires_at });
      await sendOtpEmail(email, otp);

      logger.info(`[AuthController]-[forgotPassword]: OTP sent to ${email}`);
      return sendResponse(res, { message: 'OTP sent to email' });
    } catch (err) {
      logger.error(`[AuthController]-[forgotPassword]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to send OTP' });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email, otp, newPassword, confirmPassword, bunkId } = req.body;
      if (!email || !otp || !newPassword || !confirmPassword) {
        return sendResponse(res, { success: false, error: 'All fields required', message: 'All fields required', status: 400 });
      }
      if (newPassword !== confirmPassword) {
        return sendResponse(res, { success: false, error: 'Passwords do not match', message: 'Passwords do not match', status: 400 });
      }

      const masterSequelize = getMasterSequelize();
      const masterRepo = new MasterRepository(masterSequelize);
      let user, userId, targetClientId;

      if (bunkId) {
        // Tenant user
        const client = await masterRepo.findClientById(bunkId);
        if (!client || !client.is_active) {
          return sendResponse(res, { success: false, error: 'Invalid or inactive client', message: 'User not found', status: 404 });
        }
        const { User } = await getTenantDbModels(client.db_name);
        user = await User.findOne({ where: { email } });
        if (!user) {
          return sendResponse(res, { success: false, error: 'User not found', message: 'User not found', status: 404 });
        }
        userId = user.user_id;
        targetClientId = bunkId;
      } else {
        // Super-admin
        user = await masterRepo.getSuperAdminByEmail(email); // Fixed method name
        if (!user) {
          return sendResponse(res, { success: false, error: 'Super-admin not found', message: 'User not found', status: 404 });
        }
        userId = user.id.toString();
        targetClientId = null;
      }

      const reset = await masterRepo.findValidPasswordReset({ user_id: userId, bunk_id: targetClientId, otp });
      if (!reset) {
        return sendResponse(res, { success: false, error: 'Invalid or expired OTP', message: 'Invalid or expired OTP', status: 400 });
      }

      await masterRepo.markPasswordResetUsed(reset.id);
      const hashed = await hashPassword(newPassword);

      if (bunkId) {
        const { User } = await getTenantDbModels((await masterRepo.findClientById(bunkId)).db_name);
        await User.update({ password_hash: hashed }, { where: { user_id: userId } });
      } else {
        await user.update({ password: hashed });
      }

      logger.info(`[AuthController]-[resetPassword]: Password reset for ${email}`);
      return sendResponse(res, { message: 'Password reset successful' });
    } catch (err) {
      logger.error(`[AuthController]-[resetPassword]: ${err.message}`);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to reset password' });
    }
  }
}