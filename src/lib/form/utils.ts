import type {
  FormTouched,
  ZFormObject,
  BaseFormState,
  FormErrors,
  ZFormPaths
} from './types.js';

import {
  type z,
  type ZodType,
  ZodObject,
  ZodArray,
  ZodBoolean,
  ZodNumber,
  ZodBigInt,
  ZodDate,
  ZodPipe,
  ZodFile
} from 'zod';

export const isFetchRequest = (request: Request): boolean => {
  return (
    request.headers.has('Accept') &&
    (request.headers.get('Accept') || '').startsWith('application/json')
  );
};

export const uniqueId = (prefix: string = 'skf'): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 8)}`;
};

/**
 * Clones a FormData object by creating a new instance and copying all entries
 *
 * @param formData - The FormData object to clone
 * @returns A new FormData object with all entries copied from the original
 *
 * @example
 * ```ts
 * const original = new FormData();
 * original.append('name', 'John');
 * original.append('age', '25');
 *
 * const cloned = cloneFormData(original);
 * // cloned contains all the same entries as original
 * ```
 */
export const cloneFormData = (formData: FormData): FormData => {
  const cloned = new FormData();
  formData.forEach((value, key) => {
    cloned.append(key, value);
  });
  return cloned;
};

/**
 * Creates a FormState from FormData
 * This includes reading the data, validating it, and returning the complete state
 */
export const createFormStateFromFormData = <S extends ZFormObject>(
  schema: S,
  formData: FormData
): Omit<BaseFormState<S>, 'submitted'> => {
  const data = readFormData(schema, formData) as z.infer<S>;
  const errors = validate(schema, data);
  const valid = Object.keys(errors).length === 0;

  return {
    data,
    errors,
    touched: {},
    valid
  };
};

/**
 * Marks all possible form paths as touched
 * This is useful when submitting a form to ensure all validation errors are shown
 */
export const getFormAllTouched = <S extends ZFormObject>(
  schema: S,
  data: Partial<z.infer<S>>
): FormTouched<S> => {
  const touched = {} as FormTouched<S>;

  // Helper to recursively traverse the schema and data to mark paths as touched
  const touchSchemaRecursive = (
    currentSchema: unknown,
    currentData: unknown,
    currentPath: string = ''
  ): void => {
    // Check if it's a ZodObject with shape property
    if (
      typeof currentSchema === 'object' &&
      currentSchema !== null &&
      'shape' in currentSchema &&
      typeof currentSchema.shape === 'object' &&
      currentSchema.shape !== null
    ) {
      // It's a ZodObject
      for (const [key, fieldSchema] of Object.entries(currentSchema.shape)) {
        const path = currentPath ? `${currentPath}.${key}` : key;
        const dataAtKey =
          typeof currentData === 'object' &&
          currentData !== null &&
          key in currentData
            ? (currentData as Record<string, unknown>)[key]
            : undefined;

        // For nested objects, recurse
        if (
          typeof fieldSchema === 'object' &&
          fieldSchema &&
          'shape' in fieldSchema &&
          fieldSchema.shape
        ) {
          touchSchemaRecursive(fieldSchema, dataAtKey, path);
        }
        // For arrays, mark indices based on actual data
        else if (fieldSchema instanceof ZodArray) {
          if (Array.isArray(dataAtKey)) {
            for (let i = 0; i < dataAtKey.length; i++) {
              const arrayPath = `${path}.${i}`;
              (touched as Record<string, boolean>)[arrayPath] = true;
            }
          }
        }
        // For primitives, mark the path
        else {
          (touched as Record<string, boolean>)[path] = true;
        }
      }
    } else if (
      currentSchema instanceof ZodArray &&
      Array.isArray(currentData)
    ) {
      // Direct array at current path
      for (let i = 0; i < currentData.length; i++) {
        const path = currentPath ? `${currentPath}.${i}` : `${i}`;
        (touched as Record<string, boolean>)[path] = true;
      }
    }
  };

  touchSchemaRecursive(schema, data);
  return touched;
};

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

/**
 * Removes File objects from data, replacing them with undefined
 * This is necessary because File objects cannot be serialized by devalue
 *
 * @param data - The data object to process
 * @returns A new object with File instances replaced by undefined
 *
 * @example
 * ```ts
 * const data = {
 *   name: 'John',
 *   avatar: new File(['content'], 'avatar.jpg'),
 *   age: 25n, // BigInt preserved
 *   created: new Date() // Date preserved
 * };
 *
 * const sanitized = removeFiles(data);
 * // { name: 'John', avatar: undefined, age: 25n, created: Date }
 * ```
 */
export const removeFiles = <T>(data: T): T => {
  // Handle primitives and null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Check if it's a File instance
  if (data instanceof File) {
    return undefined as T;
  }

  // Handle Date, BigInt, and other serializable objects
  if (
    data instanceof Date ||
    typeof data === 'bigint' ||
    data instanceof RegExp ||
    data instanceof Map ||
    data instanceof Set
  ) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => removeFiles(item)) as T;
  }

  // Handle plain objects
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = removeFiles(value);
    }
    return result as T;
  }

  // Return primitives (string, number, boolean) as-is
  return data;
};

/**
 * Processes a path (either array or dot-notated string) and returns both formats.
 * This is the main function for working with form paths.
 *
 * Example:
 * ```ts
 * const schema = z.object({
 *   profile: z.object({ name: z.string() }),
 *   tags: z.array(z.string())
 * });
 *
 * formPath(schema, 'profile.name');
 * // { formName: 'profile.name', path: ['profile', 'name'] }
 *
 * formPath(schema, ['tags', 0]);
 * // { formName: 'tags.0', path: ['tags', 0] }
 * ```
 */
export const formPath = <
  Schema extends ZFormObject,
  P extends ZFormPaths<Schema>
>(
  schema: Schema,
  path: P
): {
  formName: P extends string ? P : string;
  path: (string | number)[];
} => {
  let formName: string;
  let pathArray: (string | number)[];

  if (typeof path === 'string') {
    // Path is already in dot notation
    formName = path;
    // Convert to array, parsing numeric segments
    pathArray = path.split('.').map((segment) => {
      const num = Number(segment);
      return Number.isNaN(num) ? segment : num;
    });
  } else if (Array.isArray(path)) {
    // Path is in array format
    pathArray = [...path]; // Create a copy
    // Convert to dot notation
    formName = path.map((segment) => String(segment)).join('.');
  } else {
    throw new Error(`Invalid path format: ${JSON.stringify(path)}`);
  }

  // Type for Zod schema shapes at different nesting levels
  type ZShapeType =
    | Record<string, unknown> // Form object shape (top level)
    | { shape: Record<string, unknown> } // Simple or nested object
    | { element: { shape?: Record<string, unknown> } | unknown }; // Array type

  // Validate path against schema
  const validatePath = (
    currentShape: ZShapeType,
    segments: (string | number)[],
    depth: number = 0
  ) => {
    if (depth > 2) {
      throw new Error(`Invalid path: Maximum depth of 3 levels exceeded`);
    }

    if (segments.length === 0) {
      return;
    }

    const [currentSegment, ...remainingSegments] = segments;

    // First segment must be a string key in the shape
    if (depth === 0) {
      if (typeof currentSegment !== 'string') {
        throw new Error(
          `Invalid path: First segment must be a string, got ${typeof currentSegment}`
        );
      }
      // At top level, currentShape is the form object's shape
      const topShape = currentShape as Record<string, unknown>;
      if (!(currentSegment in topShape)) {
        throw new Error(
          `Invalid path: "${currentSegment}" does not exist in schema`
        );
      }
      const field = topShape[currentSegment];
      if (remainingSegments.length > 0) {
        validatePath(field as ZShapeType, remainingSegments, depth + 1);
      }
      return;
    }

    // Handle nested validation
    if (typeof currentSegment === 'number') {
      // Array access
      if (!('element' in currentShape)) {
        throw new Error(
          `Invalid path: Cannot index into non-array at depth ${depth}`
        );
      }
      if (remainingSegments.length > 0) {
        // If array contains objects, validate remaining path against element shape
        const element = (currentShape as { element: unknown }).element;
        if (element && typeof element === 'object' && 'shape' in element) {
          validatePath(element as ZShapeType, remainingSegments, depth + 1);
        } else {
          throw new Error(
            `Invalid path: Array elements are not objects at depth ${depth}`
          );
        }
      }
    } else if (typeof currentSegment === 'string') {
      // Object property access
      if (!('shape' in currentShape)) {
        throw new Error(`Invalid path: Not an object at depth ${depth}`);
      }
      const shape = (currentShape as { shape: Record<string, unknown> }).shape;
      if (!(currentSegment in shape)) {
        throw new Error(
          `Invalid path: "${currentSegment}" does not exist at depth ${depth}`
        );
      }
      const field = shape[currentSegment];
      if (remainingSegments.length > 0) {
        validatePath(field as ZShapeType, remainingSegments, depth + 1);
      }
    } else {
      throw new Error(`Invalid path segment type at depth ${depth}`);
    }
  };

  validatePath(schema.shape, pathArray, 0);

  return {
    formName: formName as P extends string ? P : string,
    path: pathArray
  };
};
