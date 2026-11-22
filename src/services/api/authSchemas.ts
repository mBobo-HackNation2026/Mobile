import { z } from 'zod';

export const authStatusSchema = z.enum(['anonymous', 'authenticated']);

export const sessionResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  user_id: z.string().min(1),
  status: authStatusSchema,
});

export const userProfileSchema = z.object({
  user_id: z.string(),
  status: authStatusSchema,
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  pesel: z.string().nullable(),
});

export type AuthStatus = z.infer<typeof authStatusSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
