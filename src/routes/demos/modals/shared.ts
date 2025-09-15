import z from 'zod';

export const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Required.')
    .max(255, 'Maximum 255 characters.')
});
