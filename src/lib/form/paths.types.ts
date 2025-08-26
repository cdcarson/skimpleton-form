import type {
  ZPrimitive,
  ZArrayOfPrimitives,
  ZSimpleObject,
  ZNestedObject,
  ZFormObject
} from './types.js';

/**
 * Path type utilities for form field access
 */

// Generate paths for simple objects (containing only primitives and arrays)
type DotPathsSimple<Shape> =
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

// Generate dot-notation paths for form objects (primitives, simple objects, nested objects, arrays)
type DotPaths<Shape> =
  Shape extends Record<string, unknown>
    ? {
        [K in keyof Shape]: K extends string
          ? Shape[K] extends ZPrimitive
            ? K
            : Shape[K] extends ZSimpleObject
              ? K | `${K}.${DotPathsSimple<Shape[K]['shape']>}`
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
                                  | `${K}.${K2}.${DotPathsSimple<Shape[K]['shape'][K2]['shape']>}`
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

// Generate array-based paths for form objects (primitives, simple objects, nested objects, arrays)
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

// Public wrapper types that take ZFormObject directly
export type ZDotPaths<Z extends ZFormObject> = DotPaths<Z['shape']>;
export type ZArrayPaths<Z extends ZFormObject> = ArrayPaths<Z['shape']>;
export type ZFormPaths<Z extends ZFormObject> = ZDotPaths<Z> | ZArrayPaths<Z>;
