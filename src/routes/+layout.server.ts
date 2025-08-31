import { getFlashMessage } from '$lib/message/flash-message.server.js';

export const load = async (event) => {
  const flashMessage = getFlashMessage(event);
  return {
    flashMessage
  };
};
