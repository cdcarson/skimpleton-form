import z from 'zod';

export const signUpSchema = z.object({
  name: z.string({ error: 'Required.' }).min(1, 'Required.'),
  email: z.email({ error: 'Invalid email.' }),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  remember: z.boolean().default(true)
});

export const signInSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string({ error: 'Required.' }).min(1, 'Required.'),
  remember: z.boolean().default(true)
});
