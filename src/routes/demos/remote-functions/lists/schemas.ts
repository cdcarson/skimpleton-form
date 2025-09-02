import z from 'zod';

// Schema for creating a new todo list
export const createTodoListSchema = z.object({
  name: z
    .string({ error: 'Required.' })
    .trim()
    .min(1, 'Required.')
    .max(255, 'Maximum 255 characters.'),
  description: z.string().trim().optional()
});
