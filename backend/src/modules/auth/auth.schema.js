import { z } from 'zod';

// Common
const email = z.string().email('Invalid email').max(255);
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

// Register — creates User + personal Organization (auto) + Membership
export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name required').max(100),
    lastName: z.string().min(1, 'Last name required').max(100),
    email,
    password,
    confirmPassword: z.string().optional(),
    organizationName: z.string().min(2).max(100).optional(),
  }).refine((d) => !d.confirmPassword || d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, 'Password required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({}).passthrough().optional(),
  // refresh token comes via httpOnly cookie, not body
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10, 'Reset token required'),
    password,
    confirmPassword: z.string().min(1),
  }).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(10),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: password,
    confirmPassword: z.string().min(1),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});
