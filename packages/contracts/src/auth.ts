import { z } from 'zod';

/**
 * Roles are permanent for the lifetime of an account. Administrators are
 * provisioned privately by a server-only command, never through registration,
 * so the public surface offers a strictly narrower set than the full role list.
 */
export const appRoleSchema = z.enum(['tenant', 'landlord', 'admin']);
export const publicRegistrationRoleSchema = z.enum(['tenant', 'landlord']);

export const accountStatusSchema = z.enum(['active', 'disabled']);

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, and underscores only.');

export const passwordSchema = z.string().min(12).max(128);

/** Philippine mobile numbers, stored as the 11-digit national format. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, 'Use an 11-digit Philippine mobile number.');

export const registerRequestSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2).max(80),
  phone: phoneSchema.optional(),
  role: publicRegistrationRoleSchema,
});

export const loginRequestSchema = z.object({
  username: usernameSchema,
  // Deliberately not `passwordSchema`: rejecting a short password at the login
  // boundary would tell an attacker the policy without them holding an account,
  // and every wrong password must fail identically anyway.
  password: z.string().min(1).max(128),
});

export const profileSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  displayName: z.string(),
  phone: z.string().nullable(),
  role: appRoleSchema,
  status: accountStatusSchema,
});

export const sessionResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number().int(),
  profile: profileSchema,
});

export type AppRole = z.infer<typeof appRoleSchema>;
export type PublicRegistrationRole = z.infer<typeof publicRegistrationRoleSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
