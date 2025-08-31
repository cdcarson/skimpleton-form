import { getSessionUser } from "$demo/authentication/authentication.server.js";

export const load = async (event) => {
  const user = await getSessionUser(event);
  return {
    user
  };
};