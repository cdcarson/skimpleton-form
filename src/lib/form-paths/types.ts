import type {
	ZodBigInt,
	ZodBoolean,
	ZodDate,
	ZodEnum,
	ZodNumber,
	ZodObject,
	ZodFile,
	ZodString,
	ZodStringFormat,
	ZodArray,
	ZodPipe
} from 'zod';

export type ZPrimitive =
	| ZodString
	| ZodStringFormat
	| ZodNumber
	| ZodBoolean
	| ZodDate
	| ZodBigInt
	| ZodEnum
	| ZodFile;

// Level 0: Just primitives
export type ZDepth0 = ZPrimitive;

// Arrays can only contain primitives (no arrays of objects allowed)
export type ZArrayOfPrimitives = ZodArray<ZDepth0>;

// Level 1: Objects containing only primitives or arrays of primitives
export type ZObjectDepth1 = ZodObject<
	Record<string, ZDepth0 | ZArrayOfPrimitives | ZodPipe<ZDepth0 | ZArrayOfPrimitives>>
>;

// Level 2: Objects that can contain Level 1 objects
export type ZObjectDepth2 = ZodObject<
	Record<
		string,
		| ZDepth0
		| ZObjectDepth1
		| ZArrayOfPrimitives
		| ZodPipe<ZDepth0 | ZObjectDepth1 | ZArrayOfPrimitives>
	>
>;

// Level 3: Top-level object that can contain Level 2 types
export type ZParentObject = ZodObject<
	Record<
		string,
		| ZDepth0
		| ZObjectDepth1
		| ZObjectDepth2
		| ZArrayOfPrimitives
		| ZodPipe<ZDepth0>
		| ZodPipe<ZObjectDepth1>
		| ZodPipe<ZObjectDepth2>
		| ZodPipe<ZArrayOfPrimitives>
	>
>;

// Path type utilities for form field access

// Extract the underlying type from refined types
type UnwrapRefined<T> = T extends ZodPipe<infer U> ? U : T;

// Generate paths for Level 1 objects (containing primitives and arrays)
type DotPathsDepth1<Shape> =
	Shape extends Record<string, unknown>
		? {
				[K in keyof Shape]: K extends string
					? UnwrapRefined<Shape[K]> extends ZDepth0
						? `${K}`
						: UnwrapRefined<Shape[K]> extends ZArrayOfPrimitives
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
					? UnwrapRefined<Shape[K]> extends ZDepth0
						? K
						: UnwrapRefined<Shape[K]> extends ZObjectDepth1
							? K | `${K}.${DotPathsDepth1<UnwrapRefined<Shape[K]>['shape']>}`
							: UnwrapRefined<Shape[K]> extends ZObjectDepth2
								?
										| K
										| {
												[K2 in keyof UnwrapRefined<Shape[K]>['shape']]: K2 extends string
													? UnwrapRefined<Shape[K]>['shape'][K2] extends ZDepth0
														? `${K}.${K2}`
														: UnwrapRefined<Shape[K]>['shape'][K2] extends ZObjectDepth1
															?
																	| `${K}.${K2}`
																	| `${K}.${K2}.${DotPathsDepth1<UnwrapRefined<Shape[K]>['shape'][K2]['shape']>}`
															: UnwrapRefined<Shape[K]>['shape'][K2] extends ZArrayOfPrimitives
																? `${K}.${K2}` | `${K}.${K2}.${number}`
																: never
													: never;
										  }[keyof UnwrapRefined<Shape[K]>['shape']]
								: UnwrapRefined<Shape[K]> extends ZArrayOfPrimitives
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
					? UnwrapRefined<Shape[K]> extends ZDepth0
						? [K]
						: UnwrapRefined<Shape[K]> extends ZObjectDepth1
							?
									| [K]
									| {
											[K2 in keyof UnwrapRefined<Shape[K]>['shape']]: K2 extends string
												? UnwrapRefined<Shape[K]>['shape'][K2] extends ZDepth0
													? [K, K2]
													: UnwrapRefined<Shape[K]>['shape'][K2] extends ZArrayOfPrimitives
														? [K, K2] | [K, K2, number]
														: never
												: never;
									  }[keyof UnwrapRefined<Shape[K]>['shape']]
							: UnwrapRefined<Shape[K]> extends ZObjectDepth2
								?
										| [K]
										| {
												[K2 in keyof UnwrapRefined<Shape[K]>['shape']]: K2 extends string
													? UnwrapRefined<Shape[K]>['shape'][K2] extends ZDepth0
														? [K, K2]
														: UnwrapRefined<Shape[K]>['shape'][K2] extends ZObjectDepth1
															?
																	| [K, K2]
																	| [
																			K,
																			K2,
																			keyof UnwrapRefined<Shape[K]>['shape'][K2]['shape'] & string
																	  ]
															: UnwrapRefined<Shape[K]>['shape'][K2] extends ZArrayOfPrimitives
																? [K, K2] | [K, K2, number]
																: never
													: never;
										  }[keyof UnwrapRefined<Shape[K]>['shape']]
								: UnwrapRefined<Shape[K]> extends ZArrayOfPrimitives
									? [K] | [K, number]
									: never
					: never;
			}[keyof Shape]
		: never;

// Main path type that combines both formats
export type FormPaths<Schema extends ZParentObject> =
	| DotPaths<Schema['shape']>
	| ArrayPaths<Schema['shape']>;

// Utility to check if a path is valid
export type IsValidPath<Schema extends ZParentObject, Path> =
	Path extends FormPaths<Schema> ? true : false;

// Extract the field type at a given path
type GetFieldAtDotPath<Shape, Path> = Path extends keyof Shape
	? UnwrapRefined<Shape[Path]> extends ZDepth0
		? UnwrapRefined<Shape[Path]>
		: UnwrapRefined<Shape[Path]> extends ZArrayOfPrimitives
			? UnwrapRefined<Shape[Path]>
			: UnwrapRefined<Shape[Path]> extends ZObjectDepth1 | ZObjectDepth2
				? UnwrapRefined<Shape[Path]>
				: never
	: Path extends `${infer K}.${infer Rest}`
		? K extends keyof Shape
			? Rest extends `${infer K2}.${infer Rest2}`
				? // Three-level path: field.subfield.subsubfield
					UnwrapRefined<Shape[K]> extends ZObjectDepth2
					? K2 extends keyof UnwrapRefined<Shape[K]>['shape']
						? UnwrapRefined<Shape[K]>['shape'][K2] extends ZObjectDepth1
							? Rest2 extends keyof UnwrapRefined<Shape[K]>['shape'][K2]['shape']
								? UnwrapRefined<Shape[K]>['shape'][K2]['shape'][Rest2]
								: never
							: UnwrapRefined<Shape[K]>['shape'][K2] extends ZArrayOfPrimitives
								? Rest2 extends `${number}`
									? UnwrapRefined<Shape[K]>['shape'][K2]['element']
									: never
								: never
						: never
					: never
				: // Two-level path: field.subfield
					UnwrapRefined<Shape[K]> extends ZObjectDepth1 | ZObjectDepth2
					? Rest extends keyof UnwrapRefined<Shape[K]>['shape']
						? UnwrapRefined<Shape[K]>['shape'][Rest]
						: never
					: UnwrapRefined<Shape[K]> extends ZArrayOfPrimitives
						? Rest extends `${number}`
							? UnwrapRefined<Shape[K]>['element']
							: never
						: never
			: never
		: never;

type GetFieldAtArrayPath<Shape, Path> = Path extends readonly [infer K]
	? K extends keyof Shape
		? UnwrapRefined<Shape[K]> extends ZDepth0
			? UnwrapRefined<Shape[K]>
			: UnwrapRefined<Shape[K]> extends ZArrayOfPrimitives
				? UnwrapRefined<Shape[K]>
				: UnwrapRefined<Shape[K]> extends ZObjectDepth1 | ZObjectDepth2
					? UnwrapRefined<Shape[K]>
					: never
		: never
	: Path extends readonly [infer K, infer K2]
		? K extends keyof Shape
			? UnwrapRefined<Shape[K]> extends ZObjectDepth1 | ZObjectDepth2
				? K2 extends keyof UnwrapRefined<Shape[K]>['shape']
					? UnwrapRefined<Shape[K]>['shape'][K2]
					: never
				: UnwrapRefined<Shape[K]> extends ZArrayOfPrimitives
					? K2 extends number
						? UnwrapRefined<Shape[K]>['element']
						: never
					: never
			: never
		: Path extends readonly [infer K, infer K2, infer K3]
			? K extends keyof Shape
				? UnwrapRefined<Shape[K]> extends ZObjectDepth2
					? K2 extends keyof UnwrapRefined<Shape[K]>['shape']
						? UnwrapRefined<Shape[K]>['shape'][K2] extends ZObjectDepth1
							? K3 extends keyof UnwrapRefined<Shape[K]>['shape'][K2]['shape']
								? UnwrapRefined<Shape[K]>['shape'][K2]['shape'][K3]
								: never
							: UnwrapRefined<Shape[K]>['shape'][K2] extends ZArrayOfPrimitives
								? K3 extends number
									? UnwrapRefined<Shape[K]>['shape'][K2]['element']
									: never
								: never
						: never
					: never
				: never
			: never;

export type GetFieldType<Schema extends ZParentObject, Path> = Path extends string
	? GetFieldAtDotPath<Schema['shape'], Path>
	: Path extends readonly unknown[]
		? GetFieldAtArrayPath<Schema['shape'], Path>
		: never;
