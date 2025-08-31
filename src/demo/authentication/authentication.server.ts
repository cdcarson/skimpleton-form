import { getDb } from '$demo/db/connection/db.server.js';
import {
  user,
  userAccount,
  userProfile,
  userSession,
  type UserAccount
} from '$demo/db/schema.js';
import type {
  CreateRegisteredUserData,
  LoginResult,
  SessionUserData
} from './authentication.shared.js';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import { eq } from 'drizzle-orm';
import z from 'zod';
import type { AppDbPostgres } from '$demo/db/connection/types.js';
import { resolve } from '$app/paths';
import { StatusCodes } from 'http-status-codes';
import argon2 from 'argon2';

const SESSION_COOKIE_NAME = 'session';
const AUTH_REDIRECT_COOKIE_NAME = 'auth-redirect';

const SESSION_COOKIE_OPTIONS: SerializeOptions & { path: string } = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
};

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const SESSION_COOKIE_PAYLOAD_SCHEMA = z.object({
  sessionId: z.string(),
  remember: z.boolean().optional().default(false)
});

type SessionCookiePayload = z.infer<typeof SESSION_COOKIE_PAYLOAD_SCHEMA>;

const getSessionCookiePayload = (
  event: RequestEvent
): SessionCookiePayload | undefined => {
  const serialized = event.cookies.get(SESSION_COOKIE_NAME);
  if (!serialized) {
    return undefined;
  }
  const deserialized = JSON.parse(serialized);
  const validated = SESSION_COOKIE_PAYLOAD_SCHEMA.safeParse(deserialized);
  if (!validated.success) {
    deleteSessionCookie(event);
    return undefined;
  }
  return validated.data;
};

const setSessionCookie = (
  event: RequestEvent,
  payload: SessionCookiePayload
) => {
  const serialized = JSON.stringify(payload);
  const expires = payload.remember
    ? new Date(Date.now() + SESSION_MAX_AGE * 1000)
    : undefined;
  event.cookies.set(SESSION_COOKIE_NAME, serialized, {
    ...SESSION_COOKIE_OPTIONS,
    expires
  });
};

const deleteSessionCookie = (event: RequestEvent) => {
  event.cookies.delete(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
};

export const setAuthRedirect = (event: RequestEvent, location?: string) => {
  const redirect = location || event.url.pathname;
  event.cookies.set(
    AUTH_REDIRECT_COOKIE_NAME,
    redirect,
    SESSION_COOKIE_OPTIONS
  );
};

const getAuthRedirect = (event: RequestEvent): string | undefined => {
  const serialized = event.cookies.get(AUTH_REDIRECT_COOKIE_NAME);
  event.cookies.delete(AUTH_REDIRECT_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  return serialized;
};

const getSessionUserData = async (
  sessionId: bigint,
  txn?: AppDbPostgres
): Promise<SessionUserData | undefined> => {
  const db = txn ?? getDb();
  const [rec] = await db
    .select({
      userSession,
      user,
      userAccount,
      userProfile
    })
    .from(userSession)
    .innerJoin(user, eq(userSession.userId, user.id))
    .leftJoin(userAccount, eq(user.id, userAccount.userId))
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .where(eq(userSession.id, sessionId));
  return rec;
};

export const getSessionUser = async (
  event: RequestEvent
): Promise<SessionUserData | undefined> => {
  const payload = getSessionCookiePayload(event);
  if (!payload) {
    return undefined;
  }
  const rec = await getSessionUserData(BigInt(payload.sessionId));
  if (!rec) {
    deleteSessionCookie(event);
    return undefined;
  }
  setSessionCookie(event, {
    sessionId: payload.sessionId,
    remember: payload.remember
  });
  return rec;
};

export const login = async (
  event: RequestEvent,
  userId: bigint,
  remember?: boolean
): Promise<LoginResult> => {
  const db = getDb();
  const [sessionRec] = await db
    .insert(userSession)
    .values({
      userId,
      ipAddress: event.getClientAddress(),
      remember: remember === true
    })
    .returning();
  setSessionCookie(event, {
    sessionId: sessionRec.id.toString(),
    remember: remember === true
  });
  const redirect = getAuthRedirect(event) ?? '/';
  const userData = await getSessionUserData(sessionRec.id);
  if (!userData) {
    throw new Error('Failed to get user data');
  }
  return {
    ...userData,
    redirect
  };
};

export const logout = (event: RequestEvent) => {
  deleteSessionCookie(event);
};

export const createRegisteredUser = async (
  event: RequestEvent,
  data: CreateRegisteredUserData
): Promise<LoginResult> => {
  const db = getDb(true);
  const currentSessionUser = await getSessionUser(event);
  let userId: bigint | undefined;
  if (
    currentSessionUser &&
    (!currentSessionUser.userAccount || !currentSessionUser.userProfile)
  ) {
    userId = currentSessionUser.user.id;
  } else {
    logout(event);
  }
  const hashedPassword = data.password
    ? await argon2.hash(data.password)
    : undefined;
  const newUserId = await db.transaction(async (tx) => {
    if (!userId) {
      const [rec] = await tx.insert(user).values({}).returning();
      userId = rec.id;
    }

    await tx.insert(userAccount).values({
      userId,
      email: data.email,
      password: hashedPassword,
      emailVerified: data.emailVerified,
      lastSignedInAt: new Date()
    });
    await tx
      .insert(userProfile)
      .values({
        userId,
        name: data.name
      })
      .returning();
    return userId;
  });
  return await login(event, newUserId, data.remember);
};

export const guardRegisteredUser = async (
  event: RequestEvent
): Promise<SessionUserData> => {
  const userData = await getSessionUser(event);
  if (!userData) {
    setAuthRedirect(event);
    throw redirect(
      StatusCodes.SEE_OTHER,
      resolve('/demos/remote-functions/auth')
    );
  }
  return userData;
};

export const getUserAccountByEmail = async (
  email: string
): Promise<UserAccount | undefined> => {
  const db = getDb();
  const [rec] = await db
    .select()
    .from(userAccount)
    .where(eq(userAccount.email, email));
  return rec;
};
