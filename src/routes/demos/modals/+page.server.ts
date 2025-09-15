import { ActionHandler } from '$lib/server.js';
import { nameSchema } from './shared.js';

export const load = async (event) => {
  const value = event.cookies.get('test-modals-value') || '';
  return {
    value
  };
};

export const actions = {
  default: async (event) => {
    const handler = new ActionHandler(
      nameSchema,
      await event.request.formData(),
      event
    );
    if (!handler.valid) {
      return handler.fail();
    }
    const { name } = handler.data;

    event.cookies.set('test-modals-value', name, {
      path: event.url.pathname,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    return handler.succeed<{ message: string; name: string }>({
      message: 'Name set successfully.',
      name
    });
  }
};
