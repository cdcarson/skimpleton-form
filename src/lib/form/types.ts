import {
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
