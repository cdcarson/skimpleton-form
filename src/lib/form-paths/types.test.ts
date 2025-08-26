import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Form Path Type System Runtime Tests', () => {
	describe('ZPrimitive types - runtime validation', () => {
		it('should validate ZodString', () => {
			const schema = z.string();
			expect(schema.parse('hello')).toBe('hello');
			expect(() => schema.parse(123)).toThrow();
		});

		it('should validate ZodStringFormat (email)', () => {
			const schema = z.email();
			expect(schema.parse('test@example.com')).toBe('test@example.com');
			expect(() => schema.parse('invalid-email')).toThrow();
		});

		it('should validate ZodNumber', () => {
			const schema = z.number();
			expect(schema.parse(42)).toBe(42);
			expect(() => schema.parse('42')).toThrow();
		});

		it('should validate ZodBoolean', () => {
			const schema = z.boolean();
			expect(schema.parse(true)).toBe(true);
			expect(() => schema.parse('true')).toThrow();
		});

		it('should validate ZodDate', () => {
			const schema = z.date();
			const testDate = new Date();
			expect(schema.parse(testDate)).toBe(testDate);
			expect(() => schema.parse('2023-01-01')).toThrow();
		});

		it('should validate ZodBigInt', () => {
			const schema = z.bigint();
			expect(schema.parse(BigInt(123))).toBe(BigInt(123));
			expect(() => schema.parse(123)).toThrow();
		});

		it('should validate ZodEnum', () => {
			const schema = z.enum(['red', 'green', 'blue']);
			expect(schema.parse('red')).toBe('red');
			expect(() => schema.parse('yellow')).toThrow();
		});

		it('should validate ZodFile', () => {
			const schema = z.file();
			const testFile = new File([''], 'test.txt');
			expect(schema.parse(testFile)).toBe(testFile);
			expect(() => schema.parse('not-a-file')).toThrow();
		});
	});

	describe('Array validation', () => {
		it('should validate array of strings', () => {
			const schema = z.array(z.string());
			expect(schema.parse(['hello', 'world'])).toEqual(['hello', 'world']);
			expect(() => schema.parse(['hello', 123])).toThrow();
		});

		it('should validate array of emails', () => {
			const schema = z.array(z.email());
			expect(schema.parse(['test@example.com', 'user@test.com'])).toEqual([
				'test@example.com',
				'user@test.com'
			]);
			expect(() => schema.parse(['valid@email.com', 'invalid'])).toThrow();
		});

		it('should validate array of numbers', () => {
			const schema = z.array(z.number());
			expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3]);
			expect(() => schema.parse([1, '2', 3])).toThrow();
		});
	});

	describe('Object validation', () => {
		it('should validate object with primitive values', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number()
			});

			expect(schema.parse({ name: 'John', age: 30 })).toEqual({
				name: 'John',
				age: 30
			});

			expect(() => schema.parse({ name: 'John', age: '30' })).toThrow();
		});

		it('should validate object with mixed primitive types', () => {
			const schema = z.object({
				email: z.email(),
				isActive: z.boolean(),
				createdAt: z.date(),
				priority: z.enum(['low', 'medium', 'high'])
			});

			const testData = {
				email: 'test@example.com',
				isActive: true,
				createdAt: new Date(),
				priority: 'high' as const
			};

			expect(schema.parse(testData)).toEqual(testData);
			expect(() =>
				schema.parse({
					...testData,
					email: 'invalid-email'
				})
			).toThrow();
		});
	});

	describe('Complex form schema validation', () => {
		it('should validate schema with primitives only', () => {
			const schema = z.object({
				name: z.string(),
				email: z.email(),
				age: z.number(),
				isActive: z.boolean()
			});

			const testData = {
				name: 'John',
				email: 'john@example.com',
				age: 30,
				isActive: true
			};

			expect(schema.parse(testData)).toEqual(testData);
		});

		it('should validate schema with arrays', () => {
			const schema = z.object({
				name: z.string(),
				tags: z.array(z.string()),
				scores: z.array(z.number())
			});

			const testData = {
				name: 'John',
				tags: ['developer', 'typescript'],
				scores: [95, 87, 92]
			};

			expect(schema.parse(testData)).toEqual(testData);
		});

		it('should validate schema with nested objects', () => {
			const schema = z.object({
				name: z.string(),
				profile: z.object({
					firstName: z.string(),
					lastName: z.string(),
					age: z.number()
				}),
				settings: z.object({
					theme: z.enum(['light', 'dark']),
					notifications: z.boolean()
				})
			});

			const testData = {
				name: 'John',
				profile: {
					firstName: 'John',
					lastName: 'Doe',
					age: 30
				},
				settings: {
					theme: 'dark' as const,
					notifications: true
				}
			};

			expect(schema.parse(testData)).toEqual(testData);
		});

		it('should validate schema with refinements', () => {
			const schema = z.object({
				password: z.string().refine((val) => val.length >= 8, {
					message: 'Password must be at least 8 characters'
				}),
				tags: z.array(z.string()).refine((arr) => arr.length > 0, {
					message: 'Must have at least one tag'
				}),
				profile: z
					.object({
						name: z.string()
					})
					.refine((obj) => obj.name.trim() !== '', {
						message: 'Name cannot be empty'
					})
			});

			const validData = {
				password: 'securepassword123',
				tags: ['typescript', 'react'],
				profile: {
					name: 'John Doe'
				}
			};

			expect(schema.parse(validData)).toEqual(validData);

			// Test refinement failures
			expect(() =>
				schema.parse({
					...validData,
					password: 'short'
				})
			).toThrow();

			expect(() =>
				schema.parse({
					...validData,
					tags: []
				})
			).toThrow();
		});

		it('should validate complex mixed schema', () => {
			const schema = z.object({
				// Primitives
				id: z.string(),
				email: z.email(),
				isVerified: z.boolean(),

				// Arrays
				tags: z.array(z.string()),
				permissions: z.array(z.enum(['read', 'write', 'admin'])),

				// Nested objects
				profile: z.object({
					firstName: z.string(),
					lastName: z.string(),
					birthDate: z.date()
				}),

				// Refinements
				username: z.string().refine((val) => val.length >= 3),
				skills: z.array(z.string()).refine((arr) => arr.length <= 10)
			});

			const testData = {
				id: 'user-123',
				email: 'user@example.com',
				isVerified: true,
				tags: ['developer', 'typescript'],
				permissions: ['read', 'write'] as const,
				profile: {
					firstName: 'John',
					lastName: 'Doe',
					birthDate: new Date('1990-01-01')
				},
				username: 'johndoe',
				skills: ['TypeScript', 'React', 'Node.js']
			};

			expect(schema.parse(testData)).toEqual(testData);
		});
	});

	describe('Error cases', () => {
		it('should reject invalid primitive fields', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number()
			});

			expect(() => schema.parse({ name: 'John', age: '30' })).toThrow();
			expect(() => schema.parse({ name: 123, age: 30 })).toThrow();
		});

		it('should reject invalid array contents', () => {
			const schema = z.object({
				tags: z.array(z.string())
			});

			expect(() => schema.parse({ tags: ['valid', 123] })).toThrow();
			expect(() => schema.parse({ tags: 'not-an-array' })).toThrow();
		});

		it('should reject invalid nested object structure', () => {
			const schema = z.object({
				profile: z.object({
					name: z.string(),
					age: z.number()
				})
			});

			expect(() =>
				schema.parse({
					profile: { name: 'John', age: '30' }
				})
			).toThrow();

			expect(() =>
				schema.parse({
					profile: { name: 'John' } // missing age
				})
			).toThrow();
		});

		it('should reject failed refinements', () => {
			const schema = z.object({
				password: z.string().refine((val) => val.length >= 8),
				tags: z.array(z.string()).refine((arr) => arr.length > 0)
			});

			expect(() =>
				schema.parse({
					password: 'short',
					tags: ['valid']
				})
			).toThrow();

			expect(() =>
				schema.parse({
					password: 'validpassword',
					tags: []
				})
			).toThrow();
		});
	});
});
