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
 * Form schema types
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

// const nestedObject: ZNestedObject = z
//   .object({
//     name: z.string().refine((value) => value.length > 0, {
//       message: 'Name must be at least 1 character long'
//     }),
//     address: z.object({
//       street: z.string(),
//       city: z.string(),
//       state: z.string(),
//       zip: z.string(),
//       tags: z.array(z.string())
//     })
//   })
//   .superRefine((o, ctx) => {
//     if (o.name.length > 0) {
//       ctx.addIssue({
//         code: 'custom',
//         message: 'Name must be at least 1 character long'
//       });
//     }
//   });
