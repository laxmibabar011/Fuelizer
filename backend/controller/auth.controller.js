import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, getCurrentUser as getCurrentUserUtil } from '../util/auth.util.js';
import { sendSuccess, sendError } from '../util/response.util.js';
import { tokenTimeToLive } from '../constants.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 'Missing credentials', 'Login failed', 400);

    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    await masterSequelize.authenticate();

    // Find user in master DB
    const user = await masterRepo.findUserByEmail(email);
    if (!user) return sendError(res, 'User not found', 'Login failed', 404);

    // Check password
    const valid = await comparePassword(password, user.password);
    if (!valid) return sendError(res, 'Invalid password', 'Login failed', 401);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store access token in DB
    await masterRepo.updateUserAccessToken(user.id, accessToken);

    // Set only refresh token as HTTP-only cookie
    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,
    //   maxAge: tokenTimeToLive.REFRESH_TOKEN_COOKIE,
    //   sameSite: 'None',
    //   secure: process.env.NODE_ENV !== 'development',
    // });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'Lax',
      secure: false,
      path: '/',
    });

    return sendSuccess(res, {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role, client_id: user.client_id }
    }, 'Login successful');
  } catch (err) {
    return sendError(res, err, 'Login error');
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return sendError(res, 'No refresh token', 'Unauthorized', 401);

    const payload = verifyRefreshToken(refreshToken);

    // Issue new access token
    const accessToken = generateAccessToken(payload);

    // Update access token in DB
    const masterSequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(masterSequelize);
    await masterRepo.updateUserAccessToken(payload.id, accessToken);

    return sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    return sendError(res, err, 'Refresh error', 401);
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
      await masterRepo.updateUserAccessToken(userId, null);
    }
    res.clearCookie('refreshToken');
    return sendSuccess(res, {}, 'Logged out');
  } catch (err) {
    return sendError(res, err, 'Logout error');
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await getCurrentUserUtil(userId);
    return sendSuccess(res, userProfile, 'Current user fetched');
  } catch (err) {
    return sendError(res, err, 'Failed to fetch current user');
  }
};