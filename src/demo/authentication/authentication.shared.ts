import { z } from 'zod';
import type {
  User,
  UserAccount,
  UserProfile,
  UserSession
} from '$demo/db/schema.js';

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().trim().min(1, 'Required'),
  remember: z.boolean().optional()
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  email: z.email(),
  password: z
    .string()
    .trim()
    .min(8, 'Password must be at least 8 characters long'),
  remember: z.boolean().optional()
});

export type SessionUserData = {
  userSession: UserSession;
  user: User;
  userAccount: UserAccount | null;
  userProfile: UserProfile | null;
};

export type LoginResult = {
  redirect: string;
} & SessionUserData;

export type CreateRegisteredUserData = {
  name: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  remember: boolean;
};
