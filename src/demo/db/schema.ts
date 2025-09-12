import { relations } from 'drizzle-orm';
import {
  customType,
  bigserial,
  bigint,
  boolean,
  varchar,
  timestamp,
  pgTable,
  text,
  uniqueIndex
} from 'drizzle-orm/pg-core';
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  }
});

export const user = pgTable('user', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const userRelations = relations(user, ({ one, many }) => ({
  account: one(userAccount),
  profile: one(userProfile),
  sessions: many(userSession),
  todoLists: many(todoList)
}));

export const userSession = pgTable('user_session', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  userId: bigint('user_id', { mode: 'bigint' })
    .notNull()
    .references(() => user.id),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  remember: boolean('remember').notNull()
});
export const userSessionRelations = relations(userSession, ({ one }) => ({
  user: one(user, { fields: [userSession.userId], references: [user.id] })
}));

export const userAccount = pgTable(
  'user_account',
  {
    userId: bigint('user_id', { mode: 'bigint' })
      .primaryKey()
      .references(() => user.id),
    email: citext('email').notNull(),
    emailVerified: boolean('email_verified'),
    password: varchar('password'),
    lastSignedInAt: timestamp('last_signed_in_at').notNull(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => {
    return [uniqueIndex('idx_user_account_unique_email').on(table.email)];
  }
);

export const userAccountRelations = relations(userAccount, ({ one }) => ({
  user: one(user, { fields: [userAccount.userId], references: [user.id] })
}));

export const userProfile = pgTable('user_profile', {
  userId: bigint('user_id', { mode: 'bigint' })
    .primaryKey()
    .references(() => user.id),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  avatarUrl: varchar('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
});
export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, { fields: [userProfile.userId], references: [user.id] })
}));

export const todoList = pgTable('todo_list', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  userId: bigint('user_id', { mode: 'bigint' })
    .notNull()
    .references(() => user.id),
  name: varchar('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
export const todoListRelations = relations(todoList, ({ one, many }) => ({
  user: one(user, { fields: [todoList.userId], references: [user.id] }),
  items: many(todoItem)
}));

export const todoItem = pgTable('todo_item', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  todoListId: bigint('todo_list_id', { mode: 'bigint' })
    .notNull()
    .references(() => todoList.id),
  name: varchar('name').notNull(),
  description: text('description'),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
export const todoItemRelations = relations(todoItem, ({ one }) => ({
  todoList: one(todoList, {
    fields: [todoItem.todoListId],
    references: [todoList.id]
  })
}));

export type User = typeof user.$inferSelect;
export type UserAccount = typeof userAccount.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type UserSession = typeof userSession.$inferSelect;
export type TodoList = typeof todoList.$inferSelect;
export type TodoItem = typeof todoItem.$inferSelect;
