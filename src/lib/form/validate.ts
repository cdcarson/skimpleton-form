import type { z } from 'zod';
import type { ZFormObject, FormErrors } from './types.js';

/**
 * Validates form data against a schema and returns field-level errors
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns An object mapping field paths to error messages
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().min(1, "Name is required"),
 *   profile: z.object({
 *     email: z.string().email("Invalid email")
 *   })
 * });
 *
 * const errors = validate(schema, { name: "", profile: { email: "invalid" } });
 * // { "name": "Name is required", "profile.email": "Invalid email" }
 * ```
 */
export const validate = <Schema extends ZFormObject>(
  schema: Schema,
  data: z.infer<Schema>
): FormErrors<Schema> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return {} as FormErrors<Schema>;
  }

  const errors: FormErrors<Schema> = {};

  // Process each error and map it to the correct path
  for (const issue of result.error.issues) {
    // Convert the path array to dot notation
    const path = issue.path.join('.') as keyof FormErrors<Schema>;

    // Use the first error message for each field
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return errors;
};
