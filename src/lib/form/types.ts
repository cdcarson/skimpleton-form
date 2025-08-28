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
  type ZodArray
} from 'zod';
import type { ActionFailure } from '@sveltejs/kit';

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

export type ZPrimitive =
  | ZodString
  | ZodStringFormat
  | ZodNumber
  | ZodBoolean
  | ZodDate
  | ZodBigInt
  | ZodEnum
  | ZodFile;

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

export type FormTouched<Z extends ZFormObject> = {
  [Path in ZDotPaths<Z>]?: boolean;
};

/**
 * The base state of a form.
 *
 * This includes:
 * - The data of the form
 * - The errors of the form
 * - The touched state of the form
 * - The validity of the form
 */
export type BaseFormState<S extends ZFormObject> = {
  data: z.infer<S>;
  errors: FormErrors<S>;
  touched: FormTouched<S>;
  valid: boolean;
  submitted: boolean;
};

export type RedirectingFormState<S extends ZFormObject> = BaseFormState<S> & {
  success?: {
    isRedirect: true;
    location: string;
    message: string;
  };
};

export type NonRedirectingFormSuccess<
  Success extends Record<string, unknown> | undefined = undefined
> = {
  isRedirect: false;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
} & (Success extends undefined ? {} : Success);

export type NonRedirectingFormSuccessParam<
  Success extends Record<string, unknown> | undefined = undefined
> = Omit<NonRedirectingFormSuccess<Success>, 'isRedirect'>;

export type NonRedirectingFormState<
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
> = BaseFormState<S> & {
  success?: NonRedirectingFormSuccess<Success>;
};

export type RedirectingRemoteFunctionHandler<S extends ZFormObject> =
  BaseFormState<S> & {
    fail: (newErrors?: Record<string, string>) => RedirectingFormState<S>;
    redirect: (successData: {
      message: string;
      location: string;
    }) => RedirectingFormState<S>;
  };

export type NonRedirectingRemoteFunctionHandler<
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
> = BaseFormState<S> & {
  fail: (newErrors?: Record<string, string>) => NonRedirectingFormState<S>;
  succeed: (
    successData: NonRedirectingFormSuccessParam<Success>
  ) => NonRedirectingFormState<S, Success>;
};

export type RedirectingActionHandler<S extends ZFormObject> =
  BaseFormState<S> & {
    fail: (
      newErrors?: Record<string, string>,
      status?: number
    ) => ActionFailure<RedirectingFormState<S>>;

    redirect: (
      successData: {
        message: string;
        location: string;
      },
      status?: number
    ) => RedirectingFormState<S>;
  };

export type NonRedirectingActionHandler<
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
> = BaseFormState<S> & {
  fail: (
    newErrors?: Record<string, string>,
    status?: number
  ) => ActionFailure<NonRedirectingFormState<S, Success>>;

  succeed: (
    successData: NonRedirectingFormSuccessParam<Success>
  ) => NonRedirectingFormState<S, Success>;
};

export type BaseFormClientState<S extends ZFormObject> = BaseFormState<S> & {
  submitting: boolean;
  computedErrors: FormErrors<S>;
  externalErrors: FormErrors<S>;
  shownErrors: FormErrors<S>;
  baseId: string;
  touch: (path: ZFormPaths<S>) => void;
  untouch: (path: ZFormPaths<S>) => void;
  touchAll: () => void;
  untouchAll: () => void;
  controlName: (path: ZFormPaths<S>) => string;
  controlId: (path: ZFormPaths<S>) => string;
  controlDescriptionId: (path: ZFormPaths<S>) => string;
};

export type RedirectingFormClientState<S extends ZFormObject> =
  BaseFormClientState<S> & {
    success?: {
      isRedirect: true;
      location: string;
      message: string;
    };
  };

export type NonRedirectingFormClientState<
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
> = BaseFormClientState<S> & {
  success?: NonRedirectingFormSuccess<Success>;
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
