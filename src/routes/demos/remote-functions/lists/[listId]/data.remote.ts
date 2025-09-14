import { form, getRequestEvent } from '$app/server';
import { RemoteFunctionHandler } from '$lib/form/handlers.server.js';
import { guardRegisteredUser } from '$demo/authentication/authentication.server.js';
import { getDb } from '$demo/db/connection/db.server.js';
import { todoList, todoItem } from '$demo/db/schema.js';
import { eq, and } from 'drizzle-orm';
import {
  createTodoItemSchema,
  updateTodoItemSchema,
  toggleTodoItemSchema,
  deleteTodoItemSchema,
  updateTodoListSchema
} from './schemas.js';

export const createTodoItem = form(async (formData) => {
  const event = getRequestEvent();
  const user = await guardRegisteredUser(event);

  const handler = new RemoteFunctionHandler(
    createTodoItemSchema,
    formData,
    event
  );

  if (!handler.valid) {
    return handler.fail();
  }

  const db = getDb();
  const listId = BigInt(handler.data.listId);

  // Verify the list belongs to the user
  const list = await db.query.todoList.findFirst({
    where: and(eq(todoList.id, listId), eq(todoList.userId, user.user.id))
  });

  if (!list) {
    return handler.fail({ listId: 'List not found or access denied' });
  }

  const [newItem] = await db
    .insert(todoItem)
    .values({
      todoListId: listId,
      name: handler.data.name,
      description: handler.data.description || null,
      completed: false
    })
    .returning();

  return handler.redirect({
    message: `Item "${newItem.name}" added!`,
    location: `/demos/remote-functions/lists/${listId}`
  });
});

export const updateTodoItem = form(async (formData) => {
  const event = getRequestEvent();
  const user = await guardRegisteredUser(event);

  const handler = new RemoteFunctionHandler(
    updateTodoItemSchema,
    formData,
    event
  );

  if (!handler.valid) {
    return handler.fail();
  }

  const db = getDb();
  const itemId = BigInt(handler.data.itemId);
  const listId = BigInt(handler.data.listId);

  // Verify the list belongs to the user
  const list = await db.query.todoList.findFirst({
    where: and(eq(todoList.id, listId), eq(todoList.userId, user.user.id))
  });

  if (!list) {
    return handler.fail({ listId: 'List not found or access denied' });
  }

  const [updatedItem] = await db
    .update(todoItem)
    .set({
      name: handler.data.name,
      description: handler.data.description || null
    })
    .where(and(eq(todoItem.id, itemId), eq(todoItem.todoListId, listId)))
    .returning();

  if (!updatedItem) {
    return handler.fail({ itemId: 'Item not found' });
  }

  return handler.redirect({
    message: `Item updated!`,
    location: `/demos/remote-functions/lists/${listId}`
  });
});

export const toggleTodoItem = form(async (formData) => {
  const event = getRequestEvent();
  const user = await guardRegisteredUser(event);

  const handler = new RemoteFunctionHandler(
    toggleTodoItemSchema,
    formData,
    event
  );

  if (!handler.valid) {
    return handler.fail();
  }

  const db = getDb();
  const itemId = BigInt(handler.data.itemId);
  const listId = BigInt(handler.data.listId);
  const completed = handler.data.completed === 'true';

  // Verify the list belongs to the user
  const list = await db.query.todoList.findFirst({
    where: and(eq(todoList.id, listId), eq(todoList.userId, user.user.id))
  });

  if (!list) {
    return handler.fail({ listId: 'List not found or access denied' });
  }

  const [updatedItem] = await db
    .update(todoItem)
    .set({ completed })
    .where(and(eq(todoItem.id, itemId), eq(todoItem.todoListId, listId)))
    .returning();

  if (!updatedItem) {
    return handler.fail({ itemId: 'Item not found' });
  }

  return handler.redirect({
    message: completed
      ? 'Item marked as complete!'
      : 'Item marked as incomplete!',
    location: `/demos/remote-functions/lists/${listId}`
  });
});

export const deleteTodoItem = form(async (formData) => {
  const event = getRequestEvent();
  const user = await guardRegisteredUser(event);

  const handler = new RemoteFunctionHandler(
    deleteTodoItemSchema,
    formData,
    event
  );

  if (!handler.valid) {
    return handler.fail();
  }

  const db = getDb();
  const itemId = BigInt(handler.data.itemId);
  const listId = BigInt(handler.data.listId);

  // Verify the list belongs to the user
  const list = await db.query.todoList.findFirst({
    where: and(eq(todoList.id, listId), eq(todoList.userId, user.user.id))
  });

  if (!list) {
    return handler.fail({ listId: 'List not found or access denied' });
  }

  const [deletedItem] = await db
    .delete(todoItem)
    .where(and(eq(todoItem.id, itemId), eq(todoItem.todoListId, listId)))
    .returning();

  if (!deletedItem) {
    return handler.fail({ itemId: 'Item not found' });
  }

  return handler.redirect({
    message: 'Item deleted!',
    location: `/demos/remote-functions/lists/${listId}`
  });
});

export const updateTodoList = form(async (formData) => {
  const event = getRequestEvent();
  const user = await guardRegisteredUser(event);

  const handler = new RemoteFunctionHandler(
    updateTodoListSchema,
    formData,
    event
  );

  if (!handler.valid) {
    return handler.fail();
  }

  const db = getDb();
  const listId = BigInt(handler.data.listId);

  // Verify the list belongs to the user and update it
  const [updatedList] = await db
    .update(todoList)
    .set({
      name: handler.data.name,
      description: handler.data.description || null
    })
    .where(and(eq(todoList.id, listId), eq(todoList.userId, user.user.id)))
    .returning();

  if (!updatedList) {
    return handler.fail({ listId: 'List not found or access denied' });
  }

  return handler.redirect({
    message: 'List updated!',
    location: `/demos/remote-functions/lists/${listId}`
  });
});
