import prisma from '../../config/db.js';

export const authRepository = {
  findUserByEmail: (email) => prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { role: true } }),

  findUserById: (id) => prisma.user.findUnique({ where: { id }, include: { role: true, memberships: { include: { organization: true, role: true } } } }),

  // Refresh session
  createRefreshSession: (data) => prisma.refreshTokenSession.create({ data }),
  findRefreshSessionByHash: (hash) => prisma.refreshTokenSession.findUnique({ where: { tokenHash: hash }, include: { user: true } }),
  revokeRefreshSession: (hash) => prisma.refreshTokenSession.update({ where: { tokenHash: hash }, data: { revokedAt: new Date() } }),
  revokeAllUserSessions: (userId) => prisma.refreshTokenSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  deleteExpiredSessions: () => prisma.refreshTokenSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),

  // Helpers
  updateLastLogin: (userId) => prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),
  updatePassword: (userId, hashed) => prisma.user.update({ where: { id: userId }, data: { password: hashed } }),
  verifyEmail: (userId) => prisma.user.update({ where: { id: userId }, data: { emailVerified: true } }),
};
