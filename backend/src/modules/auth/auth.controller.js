import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE = 'refreshToken';
const cookieOpts = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  // Cross-site (Vercel frontend -> Render backend) requires SameSite=None + Secure
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, req.ip);
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts);
    return sendSuccess(res, 201, 'Registration successful', {
      user: result.user,
      organization: result.organization,
      accessToken: result.accessToken,
    });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, req.ip);
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts);
    return sendSuccess(res, 200, 'Login successful', {
      user: result.user,
      organization: result.organization,
      accessToken: result.accessToken,
    });
  } catch (err) { next(err); }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) throw new (await import('../../utils/errors.js')).UnauthorizedError('Missing refresh token');
    const result = await authService.refresh(token, req.ip);
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts);
    return sendSuccess(res, 200, 'Token refreshed', {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return sendSuccess(res, 200, 'Logged out successfully', null);
  } catch (err) { next(err); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, 200, result.message, env.NODE_ENV !== 'production' ? { resetToken: result.resetToken } : undefined);
  } catch (err) { next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return sendSuccess(res, 200, result.message, null);
  } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    return sendSuccess(res, 200, result.message, null);
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.userId);
    return sendSuccess(res, 200, 'Profile fetched', result);
  } catch (err) { next(err); }
};
