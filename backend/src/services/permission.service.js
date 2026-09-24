import { redis } from '../config/redis.js';
import prismaClient from '../config/db.js';

const CACHE_TTL = 300; // 5m

const cacheKey = (userId, organizationId) => `perms:${userId}:${organizationId}`;

export const getUserPermissions = async (userId, organizationId) => {
  // Try Redis cache
  if (redis.status === 'ready') {
    try {
      const cached = await redis.get(cacheKey(userId, organizationId));
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  // Resolve membership role
  const membership = await prismaClient.organizationMember.findFirst({
    where: { userId, organizationId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  // Also fallback to user.role
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  const permsSet = new Set();

  // Membership role perms
  if (membership?.role?.permissions) {
    for (const rp of membership.role.permissions) permsSet.add(rp.permission.slug);
  }
  // User global role perms
  if (user?.role?.permissions) {
    for (const rp of user.role.permissions) permsSet.add(rp.permission.slug);
  }
  // super_admin + admin → all perms (production fallback when seed empty/admin has 0 perms)
  const isPrivileged = membership?.role?.slug === 'super_admin' || user?.role?.slug === 'super_admin' || membership?.role?.slug === 'admin' || user?.role?.slug === 'admin';
  if (isPrivileged) {
    const all = await prismaClient.permission.findMany({ select: { slug: true } });
    for (const p of all) permsSet.add(p.slug);
  }

  const perms = [...permsSet];
  if (redis.status === 'ready') {
    try { await redis.set(cacheKey(userId, organizationId), JSON.stringify(perms), 'EX', CACHE_TTL); } catch {}
  }
  return perms;
};

export const hasPermission = async (userId, organizationId, required) => {
  if (!required) return true;
  const perms = await getUserPermissions(userId, organizationId);
  // wildcard support: admin:read covers admin:*
  if (perms.includes(required)) return true;
  if (perms.includes('admin:read') && required.startsWith('admin:')) return false; // strict
  // Check if user has super_admin — already expanded
  return false;
};

export const invalidateCache = async (userId, organizationId) => {
  if (redis.status === 'ready') {
    try { await redis.del(cacheKey(userId, organizationId)); } catch {}
  }
};

export const invalidateOrgCache = async (organizationId) => {
  if (redis.status !== 'ready') return;
  try {
    // Use SCAN instead of KEYS to avoid blocking Redis in production
    const pattern = `perms:*:${organizationId}`;
    let cursor = '0';
    const keysToDelete = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length) keysToDelete.push(...keys);
    } while (cursor !== '0');
    if (keysToDelete.length) await redis.del(...keysToDelete);
  } catch {}
};
