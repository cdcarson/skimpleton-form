import type { RequestEvent } from '@sveltejs/kit';
import type { ApplicationMessageData } from './app-message.shared.js';
import { validateApplicationMessage } from './app-message.shared.js';

const FLASH_MESSAGE_COOKIE = 'skimpleton-flash-message';

export const setFlashMessage = (
  event: RequestEvent,
  message: ApplicationMessageData
): void => {
  const serialized = JSON.stringify(message);
  event.cookies.set(FLASH_MESSAGE_COOKIE, serialized, {
    path: '/',
    maxAge: 60 * 5, // 5 minutes
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });
};

export const getFlashMessage = (
  event: RequestEvent
): ApplicationMessageData | null => {
  const serialized = event.cookies.get(FLASH_MESSAGE_COOKIE);
  if (!serialized) {
    return null;
  }

  // Clear the cookie after reading
  event.cookies.delete(FLASH_MESSAGE_COOKIE, { path: '/' });

  try {
    const parsed = JSON.parse(serialized);
    return validateApplicationMessage(parsed);
  } catch {
    return null;
  }
};
