import z from 'zod';

export const kitchenSinkSchema = z.object({
  name: z.string({ error: 'Required.' }).min(1, 'Required.'),
  age: z.number({ error: 'Required.' }).min(21, 'Must be 21 or older'),
  email: z.email({ error: 'Invalid email.' })
});
