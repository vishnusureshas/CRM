import { verifyAccessToken } from '../utils/tokens.js';
import { UnauthorizedError } from '../utils/errors.js';

export const authenticate = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed access token'));
  }
  const token = header.split(' ')[1];
  if (!token) return next(new UnauthorizedError('Missing access token'));
  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // { userId, organizationId, role, email }
    return next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired access token'));
  }
};
