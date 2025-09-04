import z, {
  type ZodBigInt,
  type ZodBoolean,
  type ZodDate,
  type ZodEnum,
  type ZodNumber,
  type ZodObject,
  type ZodFile,
  type ZodString,
  type ZodStringFormat,
  type ZodArray,
  type ZodDefault,
  type ZodPrefault,
  type ZodOptional,
  type ZodNullable
} from 'zod';

/**
 * Form schema types with depth restrictions
 *
 * These types define a 3-level deep schema structure for forms:
 * - Level 0 (Top/ZFormObject): Can contain primitives, simple objects, nested objects, or arrays
 * - Level 1 (ZSimpleObject): Can only contain primitives or arrays of primitives
 * - Level 2 (ZNestedObject): Can contain primitives, simple objects, or arrays
 *
 * This structure ensures:
 * 1. Maximum nesting depth of 3 levels (e.g., "user.profile.name")
 * 2. Arrays can only contain primitives, not objects
 * 3. Objects at the deepest level can only contain primitives or arrays
 *
 * Valid paths examples:
 * - "name" (primitive at top level)
 * - "profile.firstName" (primitive in simple object)
 * - "settings.notifications.email" (primitive in nested object)
 * - "tags.0" (array element access)
 * - "profile.hobbies.2" (nested array element)
 */

// Base primitive types without modifiers
type ZPrimitiveBase =
  | ZodString
  | ZodStringFormat
  | ZodNumber
  | ZodBoolean
  | ZodDate
  | ZodBigInt
  | ZodEnum
  | ZodFile;

// Primitive types including modifiers
export type ZPrimitive =
  | ZPrimitiveBase
  | ZodDefault<ZPrimitiveBase>
  | ZodPrefault<ZPrimitiveBase>
  | ZodOptional<ZPrimitiveBase>
  | ZodNullable<ZPrimitiveBase>;

// Arrays can only contain primitives (no arrays of objects allowed)
export type ZArrayOfPrimitives = ZodArray<ZPrimitive>;

// Objects containing only primitives or arrays of primitives
export type ZSimpleObject = ZodObject<
  Record<string, ZPrimitive | ZArrayOfPrimitives>
>;

// Objects that can contain ZSimpleObject
export type ZNestedObject = ZodObject<
  Record<string, ZPrimitive | ZSimpleObject | ZArrayOfPrimitives>
>;

// Top-level form object
export type ZFormObject = ZodObject<
  Record<
    string,
    ZPrimitive | ZSimpleObject | ZNestedObject | ZArrayOfPrimitives
  >
>;

/**
 * Form state types
 */

export type FormErrors<Z extends ZFormObject> = {
  [Path in ZDotPaths<Z>]?: string;
};

/**
 * The shape of form success. Indicates whether the form redirects or not.
 * If the form redirects, the success data is `{location: string, message: string}`.
 * If the form does not redirect, the shape is `{message: string}` plus the shape defined by `Success`.
 */
export type FormSuccess<
  IsRedirect extends boolean,
  Success extends { message: string } = { message: string }
> = {
  isRedirect: IsRedirect;
} & (IsRedirect extends true ? { location: string; message: string } : Success);

/**
 * Base form state, shared by server and client.
 */
export type FormState<S extends ZFormObject> = {
  data: z.infer<S>;
  errors: FormErrors<S>;
  valid: boolean;
};

/**
 * Server form state, used by form actions and remote functions.
 */
export type ServerFormState<
  S extends ZFormObject,
  IsRedirect extends boolean = true,
  Success extends { message: string } = { message: string }
> = {
  data: z.infer<S>;
  errors: FormErrors<S>;
  valid: boolean;
  success?: FormSuccess<IsRedirect, Success>;
};

/**
 * Path type utilities for form field access
 */

// Generate paths for simple objects (containing only primitives and arrays)
// private type; public wrapper type is ZDotPaths
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
// private type; public wrapper type is ZArrayPaths
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
