import z from 'zod';

// Schema for creating a new todo item
export const createTodoItemSchema = z.object({
  listId: z.string().min(1, 'List ID is required'),
  name: z
    .string({ error: 'Required.' })
    .trim()
    .min(1, 'Required.')
    .max(255, 'Maximum 255 characters.'),
  description: z.string().trim().optional()
});

// Schema for updating a todo item
export const updateTodoItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  listId: z.string().min(1, 'List ID is required'),
  name: z
    .string({ error: 'Required.' })
    .trim()
    .min(1, 'Required.')
    .max(255, 'Maximum 255 characters.'),
  description: z.string().trim().optional()
});

// Schema for toggling todo item completion
export const toggleTodoItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  listId: z.string().min(1, 'List ID is required'),
  completed: z.enum(['true', 'false'])
});

// Schema for deleting a todo item
export const deleteTodoItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  listId: z.string().min(1, 'List ID is required')
});
