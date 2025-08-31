import { guardRegisteredUser } from '$demo/authentication/authentication.server.js';

export const load = async (event) => {
  const registeredUser = await guardRegisteredUser(event);
  return {
    registeredUser
  };
};
