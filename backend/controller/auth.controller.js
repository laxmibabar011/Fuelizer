// Controller uses sendResponse for all API responses and logger.info/logger.error for logging
import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, getCurrentUser as getCurrentUserUtil, hashPassword } from '../util/auth.util.js';
import { sendResponse } from '../util/response.util.js';
import { logger } from '../util/logger.util.js';
import { sendOtpEmail } from '../util/mailer.util.js';
// import { tokenTimeToLive, USER_ROLES } from '../constants.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendResponse(res, { success: false, error: 'Missing credentials', message: 'Login failed', status: 400 });

    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    await masterSequelize.authenticate();

    // Find user in master DB
    const user = await masterRepo.findMasterUserByEmail(email);
    if (!user) return sendResponse(res, { success: false, error: 'User not found', message: 'Login failed', status: 404 });

    // Check password
    const valid = await comparePassword(password, user.password);
    if (!valid) return sendResponse(res, { success: false, error: 'Invalid password', message: 'Login failed', status: 401 });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store access token in DB
    await masterRepo.updateMasterUserAccessToken(user.id, accessToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'Lax',
      secure: false,
      path: '/',
    });

    logger.info(`[auth.controller]-[login]: User ${email} logged in successfully`);
    return sendResponse(res, {
      data: {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role, client_id: user.client_id }
      },
      message: 'Login successful',
    });
  } catch (err) {
    logger.error(`[auth.controller]-[login]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Login error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return sendResponse(res, { success: false, error: 'No refresh token', message: 'Unauthorized', status: 401 });

    const payload = verifyRefreshToken(refreshToken);

    // Issue new access token
    const accessToken = generateAccessToken(payload);

    // Update access token in DB
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    await masterRepo.updateMasterUserAccessToken(payload.id, accessToken);

    logger.info(`[auth.controller]-[refresh]: Token refreshed for user ${payload.email}`);
    return sendResponse(res, { data: { accessToken }, message: 'Token refreshed' });
  } catch (err) {
    logger.error(`[auth.controller]-[refresh]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Refresh error', status: 401 });
  }
};

export const logout = async (req, res) => {
  try {
    // Remove access token from DB
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    // Try to get user ID from access token (if provided)
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = token ? verifyRefreshToken(token) : null;
        userId = payload ? payload.id : null;
      } catch (e) { /* ignore */ }
    }
    if (userId) {
      await masterRepo.updateMasterUserAccessToken(userId, null);
    }
    res.clearCookie('refreshToken');
    logger.info(`[auth.controller]-[logout]: User logged out`);
    return sendResponse(res, { data: {}, message: 'Logged out' });
  } catch (err) {
    logger.error(`[auth.controller]-[logout]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Logout error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await getCurrentUserUtil(userId);
    logger.info(`[auth.controller]-[getCurrentUser]: Profile fetched for user ${userId}`);
    return sendResponse(res, { data: userProfile, message: 'Current user fetched' });
  } catch (err) {
    logger.error(`[auth.controller]-[getCurrentUser]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Failed to fetch current user' });
  }
};

// Forgot Password: Request OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendResponse(res, { success: false, error: 'Email required', message: 'Email required', status: 400 });
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const user = await masterRepo.findMasterUserByEmail(email);
    if (!user) return sendResponse(res, { success: false, error: 'User not found', message: 'User not found', status: 404 });
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await masterRepo.createPasswordReset({ user_id: user.id, otp, expires_at });
    await sendOtpEmail(email, otp);
    logger.info(`[auth.controller]-[forgotPassword]: OTP sent to ${email}`);
    return sendResponse(res, { message: 'OTP sent to email' });
  } catch (err) {
    logger.error(`[auth.controller]-[forgotPassword]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Failed to send OTP' });
  }
};

// Reset Password: Verify OTP and set new password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    if (!email || !otp || !newPassword || !confirmPassword) {
      return sendResponse(res, { success: false, error: 'All fields required', message: 'All fields required', status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return sendResponse(res, { success: false, error: 'Passwords do not match', message: 'Passwords do not match', status: 400 });
    }
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    const user = await masterRepo.findMasterUserByEmail(email);
    if (!user) return sendResponse(res, { success: false, error: 'User not found', message: 'User not found', status: 404 });
    // Find valid OTP
    const reset = await masterRepo.findValidPasswordReset({ user_id: user.id, otp });
    if (!reset) {
      return sendResponse(res, { success: false, error: 'Invalid or expired OTP', message: 'Invalid or expired OTP', status: 400 });
    }
    // Mark OTP as used
    await masterRepo.markPasswordResetUsed(reset.id);
    // Hash new password
    const hashed = await hashPassword(newPassword);
    await user.update({ password: hashed });
    logger.info(`[auth.controller]-[resetPassword]: Password reset for ${email}`);
    return sendResponse(res, { message: 'Password reset successful' });
  } catch (err) {
    logger.error(`[auth.controller]-[resetPassword]: ${err.message}`);
    return sendResponse(res, { success: false, error: err, message: 'Failed to reset password' });
  }
};