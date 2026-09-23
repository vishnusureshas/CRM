import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { authRepository } from './auth.repository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } from '../../utils/tokens.js';
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../../utils/errors.js';

// Helper: slugify org name → unique slug
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const buildAccessPayload = (user, organizationId, roleSlug) => ({
  userId: user.id,
  email: user.email,
  organizationId,
  role: roleSlug || user.role?.slug || 'sales_rep',
});

// ── Register ────────────────────────────────────────────
export const register = async ({ firstName, lastName, email, password, organizationName }, ip) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await authRepository.findUserByEmail(normalizedEmail);
  if (existing) throw new ConflictError('Email already registered');

  const hashed = await bcrypt.hash(password, 10);

  // Transaction: create user + organization + membership
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        password: hashed,
        firstName,
        lastName,
        status: 'ACTIVE',
        emailVerified: false,
      },
    });

    const orgName = organizationName?.trim() || `${firstName}'s Workspace`;
    let baseSlug = slugify(orgName) || `org-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (await tx.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const organization = await tx.organization.create({
      data: { name: orgName, slug, status: 'ACTIVE' },
    });

    // try to assign Admin role to creator
    const adminRole = await tx.role.findFirst({ where: { slug: 'admin' } });

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        roleId: adminRole?.id || null,
      },
    });

    // default pipeline for new org
    const pipeline = await tx.pipeline.create({
      data: { organizationId: organization.id, name: 'Sales Pipeline', isDefault: true },
    });
    const stages = [
      { name: 'New', order: 1, probability: 10, color: '#94a3b8' },
      { name: 'Qualification', order: 2, probability: 30, color: '#38bdf8' },
      { name: 'Proposal', order: 3, probability: 60, color: '#f59e0b' },
      { name: 'Negotiation', order: 4, probability: 80, color: '#8b5cf6' },
      { name: 'Closed Won', order: 5, probability: 100, color: '#22c55e', isClosed: true },
      { name: 'Closed Lost', order: 6, probability: 0, color: '#ef4444', isClosed: true },
    ];
    for (const s of stages) {
      await tx.pipelineStage.create({ data: { pipelineId: pipeline.id, ...s } });
    }

    return { user, organization };
  });

  // Issue tokens immediately after registration (auto-login)
  const payload = buildAccessPayload(result.user, result.organization.id, 'admin');
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: result.user.id, organizationId: result.organization.id });
  const tokenHash = hashToken(refreshToken);

  // refresh expiry: parse env var (default 7d)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepository.createRefreshSession({
    userId: result.user.id,
    tokenHash,
    expiresAt,
    ipAddress: ip,
  });

  return {
    user: sanitizeUser(result.user),
    organization: result.organization,
    accessToken,
    refreshToken,
  };
};

// ── Login ───────────────────────────────────────────────
export const login = async ({ email, password }, ip) => {
  const normalizedEmail = email.toLowerCase().trim();

  // brute-force guard via Redis
  const lockKey = `login:lock:${normalizedEmail}`;
  const attemptsKey = `login:attempts:${normalizedEmail}`;
  if (redis.status === 'ready') {
    const isLocked = await redis.get(lockKey);
    if (isLocked) throw new UnauthorizedError('Account temporarily locked. Try again in 15 minutes');
  }

  const user = await authRepository.findUserByEmail(normalizedEmail);
  if (!user) {
    await incrementAttempts(attemptsKey, lockKey);
    throw new UnauthorizedError('Invalid email or password');
  }
  if (user.status !== 'ACTIVE') throw new UnauthorizedError('Account is not active');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await incrementAttempts(attemptsKey, lockKey);
    throw new UnauthorizedError('Invalid email or password');
  }

  // reset attempts on success
  if (redis.status === 'ready') await redis.del(attemptsKey);

  // find primary organization membership
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true, role: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!membership) throw new UnauthorizedError('No organization membership found');
  if (membership.organization.status !== 'ACTIVE') throw new UnauthorizedError('Organization is suspended');

  const payload = buildAccessPayload(user, membership.organizationId, membership.role?.slug || user.role?.slug);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user.id, organizationId: membership.organizationId });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshTokenSession.create({
    data: { userId: user.id, tokenHash, expiresAt, ipAddress: ip },
  });
  await authRepository.updateLastLogin(user.id);

  return {
    user: sanitizeUser(user),
    organization: membership.organization,
    accessToken,
    refreshToken,
  };
};

const incrementAttempts = async (attemptsKey, lockKey) => {
  if (redis.status !== 'ready') return;
  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) await redis.expire(attemptsKey, 15 * 60);
  if (attempts >= 5) {
    await redis.set(lockKey, '1', 'EX', 15 * 60);
    await redis.del(attemptsKey);
  }
};

// ── Refresh (rotation) ──────────────────────────────────
export const refresh = async (refreshTokenFromCookie, ip) => {
  if (!refreshTokenFromCookie) throw new UnauthorizedError('Missing refresh token');
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshTokenFromCookie);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
  const tokenHash = hashToken(refreshTokenFromCookie);
  const session = await authRepository.findRefreshSessionByHash(tokenHash);
  if (!session) throw new UnauthorizedError('Refresh session not found');
  if (session.revokedAt) throw new UnauthorizedError('Refresh token revoked');
  if (session.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expired');

  // rotate: revoke old, issue new
  await prisma.refreshTokenSession.update({ where: { tokenHash }, data: { revokedAt: new Date() } });

  const user = await authRepository.findUserById(session.userId);
  if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError('User not active');

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, organizationId: decoded.organizationId },
    include: { organization: true, role: true },
  });
  const organizationId = membership?.organizationId || decoded.organizationId;
  const payload = buildAccessPayload(user, organizationId, membership?.role?.slug || user.role?.slug);
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken({ userId: user.id, organizationId });
  const newHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshTokenSession.create({ data: { userId: user.id, tokenHash: newHash, expiresAt, ipAddress: ip } });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) };
};

// ── Logout ──────────────────────────────────────────────
export const logout = async (refreshTokenFromCookie) => {
  if (!refreshTokenFromCookie) return;
  const tokenHash = hashToken(refreshTokenFromCookie);
  try {
    await prisma.refreshTokenSession.update({ where: { tokenHash }, data: { revokedAt: new Date() } });
  } catch {
    // already revoked / not found → ignore
  }
};

// ── Forgot / Reset ──────────────────────────────────────
export const forgotPassword = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await authRepository.findUserByEmail(normalizedEmail);
  // do not reveal whether email exists
  if (!user) return { message: 'If that email exists, a reset link has been sent' };

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // store in Redis if available, else in DB-adjacent? Use Redis
  if (redis.status === 'ready') {
    await redis.set(`reset:${hashed}`, user.id, 'EX', 15 * 60);
  } else {
    // fallback: store hashed token as a refresh session with short expiry for demo
    await prisma.refreshTokenSession.create({
      data: { userId: user.id, tokenHash: `reset-${hashed}`, expiresAt },
    });
  }
  // In production: queue email via BullMQ. For Phase 2 we return token in response when NODE_ENV !== production for testing
  if (env.NODE_ENV !== 'production') {
    return { message: 'Reset token generated', resetToken: rawToken };
  }
  return { message: 'If that email exists, a reset link has been sent' };
};

export const resetPassword = async ({ token, password }) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  let userId = null;

  if (redis.status === 'ready') {
    userId = await redis.get(`reset:${hashed}`);
    if (!userId) {
      // fallback check in DB
      const fallback = await prisma.refreshTokenSession.findUnique({ where: { tokenHash: `reset-${hashed}` } });
      if (!fallback || fallback.expiresAt < new Date()) throw new BadRequestError('Invalid or expired reset token');
      userId = fallback.userId;
      await prisma.refreshTokenSession.delete({ where: { tokenHash: `reset-${hashed}` } });
    } else {
      await redis.del(`reset:${hashed}`);
    }
  } else {
    const fallback = await prisma.refreshTokenSession.findUnique({ where: { tokenHash: `reset-${hashed}` } });
    if (!fallback || fallback.expiresAt < new Date()) throw new BadRequestError('Invalid or expired reset token');
    userId = fallback.userId;
    await prisma.refreshTokenSession.delete({ where: { tokenHash: `reset-${hashed}` } });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  // revoke all refresh sessions for security
  await prisma.refreshTokenSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  return { message: 'Password reset successfully' };
};

// ── Change password (authenticated) ─────────────────────
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return { message: 'Password changed successfully' };
};

// ── Me ──────────────────────────────────────────────────
export const getMe = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) throw new NotFoundError('User not found');
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true, role: true },
  });
  return { user: sanitizeUser(user), memberships };
};

// ── Helpers ─────────────────────────────────────────────
const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};
