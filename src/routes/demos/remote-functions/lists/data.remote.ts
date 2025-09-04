import { form, getRequestEvent } from '$app/server';
import { resolve } from '$app/paths';
import { RemoteFunctionHandler } from '$lib/form/handlers.server.js';
import { guardRegisteredUser } from '$demo/authentication/authentication.server.js';
import { getDb } from '$demo/db/connection/db.server.js';
import { todoList } from '$demo/db/schema.js';
import { createTodoListSchema } from './schemas.js';

export const createTodoList = form(async (formData) => {
  const event = getRequestEvent();

  // Ensure user is authenticated
  const user = await guardRegisteredUser(event);

  // Create handler and validate form data
  const handler = new RemoteFunctionHandler(
    createTodoListSchema,
    formData,
    event
  );

  if (!handler.valid) {
    return handler.fail();
  }

  const db = getDb();
  const [newTodoList] = await db
    .insert(todoList)
    .values({
      userId: user.user.id,
      name: handler.data.name,
      description: handler.data.description || null
    })
    .returning();

  return handler.redirect({
    message: `Todo list "${newTodoList.name}" created!`,
    location: resolve('/demos/remote-functions/lists/[listId]', {
      listId: newTodoList.id.toString()
    })
  });
});
