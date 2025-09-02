import { guardRegisteredUser } from '$demo/authentication/authentication.server.js';
import { getDb } from '$demo/db/connection/db.server.js';
import { todoList } from '$demo/db/schema.js';
import { eq } from 'drizzle-orm';

export const load = async (event) => {
  const registeredUser = await guardRegisteredUser(event);

  // Fetch todo lists for the authenticated user
  const db = getDb();
  const todoLists = await db
    .select()
    .from(todoList)
    .where(eq(todoList.userId, registeredUser.user.id));

  return {
    registeredUser,
    todoLists
  };
};
