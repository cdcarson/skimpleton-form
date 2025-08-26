import {
  type z,
  type ZodType,
  ZodObject,
  ZodArray,
  ZodBoolean,
  ZodNumber,
  ZodBigInt,
  ZodDate,
  ZodDiscriminatedUnion,
  ZodPipe,
  ZodFile
} from 'zod';
import type { ZFormObject } from './types.js';

/**
 * Gets the number of array elements in a form using our dot-notation naming convention.
 *
 * @example
 * ```ts
 * // For form fields named "tags.0", "tags.1", "tags.2"
 * getFormDataArrayLength(formData, "tags") // returns 3
 * ```
 */
export const getFormDataArrayLength = (
  formData: FormData,
  formName: string
): number => {
  const keys = Array.from(formData.keys());
  const rx = new RegExp(`^${formName}\\.(\\d+)`);
  const indices = new Set<number>();
  for (const key of keys) {
    if (!key.startsWith(`${formName}.`)) {
      continue;
    }
    const result = rx.exec(key);
    if (result) {
      indices.add(parseInt(result[1]));
    }
  }
  return indices.size === 0 ? 0 : Math.max(...Array.from(indices)) + 1;
};

/**
 * Reads form data from a FormData object and converts it to a typed object
 * based on the provided Zod schema.
 *
 * Handles:
 * - Nested objects (up to 3 levels deep as per ZFormObject constraints)
 * - Arrays with dot-notation indices (e.g., "tags.0", "tags.1")
 * - Type conversions (strings to numbers, booleans, dates, etc.)
 * - File inputs
 * - Refined/transformed schemas
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   tags: z.array(z.string())
 * });
 *
 * const data = readFormData(schema, formData);
 * // { name: "John", age: 25, tags: ["tag1", "tag2"] }
 * ```
 */
export const readFormData = <S extends ZFormObject>(
  formSchema: S,
  formData: FormData
): Partial<z.infer<S>> => {
  const processSchema = (
    schema: ZodType,
    currentPath: string = ''
  ): Partial<z.infer<typeof schema>> | undefined => {
    const value = formData.get(currentPath);
    if (value instanceof File) {
      return value;
    }

    if (schema instanceof ZodDiscriminatedUnion) {
      let o: Partial<z.infer<typeof schema>> = {};
      for (const option of schema.options) {
        o = { ...o, ...processSchema(option as ZodType, currentPath) };
      }
      return o;
    }

    // Handle refined/transformed schemas (ZodPipe is created by .refine(), .transform(), etc.)
    if (schema instanceof ZodPipe && 'in' in schema) {
      // Process the input schema (the schema before transformation/refinement)
      return processSchema(schema.in as ZodType, currentPath);
    }
    if (schema instanceof ZodArray) {
      const length = getFormDataArrayLength(formData, currentPath);
      const arr = [];
      for (let i = 0; i < length; i++) {
        arr.push(
          processSchema(schema.element as ZodType, `${currentPath}.${i}`)
        );
      }
      return arr;
    }
    if (schema instanceof ZodObject) {
      const o: Partial<z.infer<typeof schema>> = {};
      for (const [key, value] of Object.entries(schema.shape)) {
        o[key] = processSchema(
          value as ZodType,
          currentPath ? `${currentPath}.${key}` : key
        );
      }
      return o;
    }
    // Handle non-string primitive types that need conversion
    if (schema instanceof ZodFile) {
      // Files are handled at the start of processSchema (line 76-78)
      // If we reach here and schema expects a file but value isn't one, return undefined
      return undefined;
    }
    if (schema instanceof ZodBoolean) {
      return typeof value === 'string' && value.toLowerCase() === 'on';
    }
    if (schema instanceof ZodNumber) {
      return value !== null && value !== undefined ? Number(value) : undefined;
    }
    if (schema instanceof ZodBigInt) {
      return value !== null && value !== undefined ? BigInt(value) : undefined;
    }
    if (schema instanceof ZodDate) {
      return value !== null && value !== undefined
        ? new Date(value)
        : undefined;
    }

    // For all string-like types (ZodString, ZodEmail, ZodURL, ZodEnum, ZodLiteral, etc.)
    // and any other types, return the value if it's a string (including empty strings) or undefined
    return typeof value === 'string' ? value : undefined;
  };
  return processSchema(formSchema as ZodType) as Partial<z.infer<S>>;
};
