import { getDb } from '$demo/db/connection/db.server.js';
import { guardRegisteredUser } from '$demo/authentication/authentication.server.js';
import type { PageServerLoad } from './$types.js';
import { todoList } from '$demo/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const user = await guardRegisteredUser(event);
  const listId = BigInt(event.params.listId);

  const db = getDb();

  // Get the list with its items
  const list = await db.query.todoList.findFirst({
    where: and(eq(todoList.id, listId), eq(todoList.userId, user.user.id)),
    with: {
      items: {
        orderBy: (todoItem, { asc }) => [asc(todoItem.createdAt)]
      }
    }
  });

  if (!list) {
    error(404, 'List not found');
  }

  return {
    list: {
      ...list,
      id: list.id.toString(),
      userId: list.userId.toString(),
      items: list.items.map((item) => ({
        ...item,
        id: item.id.toString(),
        todoListId: item.todoListId.toString()
      }))
    }
  };
};
