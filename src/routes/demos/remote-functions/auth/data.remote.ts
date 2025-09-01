import { form, getRequestEvent } from '$app/server';
import {
  createRegisteredUser,
  getUserAccountByEmail,
  login,
  logout,
  setAuthRedirect
} from '$demo/authentication/authentication.server.js';
import { RemoteFunctionHandler } from '$lib/form/server.js';
import zod from 'zod';
import { signInSchema, signUpSchema } from './schemas.js';
import { verify } from 'argon2';
import { resolve } from '$app/paths';

export const signUp = form(async (formData) => {
  const event = getRequestEvent();
  const handler = new RemoteFunctionHandler(signUpSchema, formData, event);

  if (!handler.valid) {
    return handler.fail();
  }
  const { name, email, password, remember } = handler.data;
  const account = await getUserAccountByEmail(email);
  if (account) {
    return handler.fail({
      email: `An account with the email ${email} already exists.`
    });
  }
  const { userProfile, redirect } = await createRegisteredUser(event, {
    name,
    email,
    password,
    remember,
    emailVerified: false
  });
  return handler.redirect({
    message: `Welcome ${userProfile?.name}! You're signed up!`,
    location: redirect
  });
});

export const signIn = form(async (formData) => {
  const event = getRequestEvent();
  const handler = new RemoteFunctionHandler(signInSchema, formData, event);
  if (!handler.valid) {
    return handler.fail();
  }
  const { email, password, remember } = handler.data;
  const account = await getUserAccountByEmail(email);
  if (!account) {
    return handler.fail({
      email: `We could not find an account with the email ${email}.`
    });
  }
  if (!account.password) {
    return handler.fail({
      password: 'This account does not yet have a password.'
    });
  }
  const validPassword = await verify(account.password, password);
  if (!validPassword) {
    return handler.fail({
      password: 'Incorrect password.'
    });
  }

  const { redirect, userProfile } = await login(
    event,
    account.userId,
    remember
  );
  return handler.redirect({
    message: `Welcome back ${userProfile?.name}! You're signed in!`,
    location: redirect
  });
});

export const signOut = form(async (formData) => {
  const event = getRequestEvent();
  const handler = new RemoteFunctionHandler(zod.object({}), formData, event);
  setAuthRedirect(event, resolve('/demos/remote-functions'));
  logout(event);
  return handler.redirect({
    message: 'You have been signed out.',
    location: resolve('/demos/remote-functions/auth')
  });
});
