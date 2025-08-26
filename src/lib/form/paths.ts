import type {
  ZPrimitive,
  ZArrayOfPrimitives,
  ZSimpleObject,
  ZNestedObject,
  ZFormObject
} from './types.js';

// Path type utilities for form field access

// Generate paths for Level 1 objects (containing primitives and arrays)
type DotPathsDepth1<Shape> =
  Shape extends Record<string, unknown>
    ? {
        [K in keyof Shape]: K extends string
          ? Shape[K] extends ZPrimitive
            ? `${K}`
            : Shape[K] extends ZArrayOfPrimitives
              ? `${K}` | `${K}.${number}`
              : never
          : never;
      }[keyof Shape]
    : never;

// Generate dot-notation paths for a schema shape (up to 3 levels)
type DotPaths<Shape> =
  Shape extends Record<string, unknown>
    ? {
        [K in keyof Shape]: K extends string
          ? Shape[K] extends ZPrimitive
            ? K
            : Shape[K] extends ZSimpleObject
              ? K | `${K}.${DotPathsDepth1<Shape[K]['shape']>}`
              : Shape[K] extends ZNestedObject
                ?
                    | K
                    | {
                        [K2 in keyof Shape[K]['shape']]: K2 extends string
                          ? Shape[K]['shape'][K2] extends ZPrimitive
                            ? `${K}.${K2}`
                            : Shape[K]['shape'][K2] extends ZSimpleObject
                              ?
                                  | `${K}.${K2}`
                                  | `${K}.${K2}.${DotPathsDepth1<Shape[K]['shape'][K2]['shape']>}`
                              : Shape[K]['shape'][K2] extends ZArrayOfPrimitives
                                ? `${K}.${K2}` | `${K}.${K2}.${number}`
                                : never
                          : never;
                      }[keyof Shape[K]['shape']]
                : Shape[K] extends ZArrayOfPrimitives
                  ? K | `${K}.${number}`
                  : never
          : never;
      }[keyof Shape]
    : never;

// Generate array-based paths for a schema shape (up to 3 levels)
type ArrayPaths<Shape> =
  Shape extends Record<string, unknown>
    ? {
        [K in keyof Shape]: K extends string
          ? Shape[K] extends ZPrimitive
            ? [K]
            : Shape[K] extends ZSimpleObject
              ?
                  | [K]
                  | {
                      [K2 in keyof Shape[K]['shape']]: K2 extends string
                        ? Shape[K]['shape'][K2] extends ZPrimitive
                          ? [K, K2]
                          : Shape[K]['shape'][K2] extends ZArrayOfPrimitives
                            ? [K, K2] | [K, K2, number]
                            : never
                        : never;
                    }[keyof Shape[K]['shape']]
              : Shape[K] extends ZNestedObject
                ?
                    | [K]
                    | {
                        [K2 in keyof Shape[K]['shape']]: K2 extends string
                          ? Shape[K]['shape'][K2] extends ZPrimitive
                            ? [K, K2]
                            : Shape[K]['shape'][K2] extends ZSimpleObject
                              ?
                                  | [K, K2]
                                  | [
                                      K,
                                      K2,
                                      keyof Shape[K]['shape'][K2]['shape'] &
                                        string
                                    ]
                              : Shape[K]['shape'][K2] extends ZArrayOfPrimitives
                                ? [K, K2] | [K, K2, number]
                                : never
                          : never;
                      }[keyof Shape[K]['shape']]
                : Shape[K] extends ZArrayOfPrimitives
                  ? [K] | [K, number]
                  : never
          : never;
      }[keyof Shape]
    : never;

// Main path type that combines both formats
export type FormPaths<Schema extends ZFormObject> =
  | DotPaths<Schema['shape']>
  | ArrayPaths<Schema['shape']>;

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
export const formPath = <Schema extends ZFormObject>(
  schema: Schema,
  path: FormPaths<Schema>
): {
  formName: string;
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

  // Type for Zod schema shape at different depths
  type ZShapeType =
    | Record<string, unknown> // Top-level shape (depth 0)
    | { shape: Record<string, unknown> } // Nested object
    | { element: { shape?: Record<string, unknown> } | unknown }; // Array

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
      // At depth 0, currentShape is Record<string, unknown>
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

  return { formName, path: pathArray };
};
