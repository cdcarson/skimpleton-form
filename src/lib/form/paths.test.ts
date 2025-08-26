import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { formPath, type ZParentObject } from './paths.js';

describe('formPath function', () => {
  const testSchema = z.object({
    name: z.string(),
    email: z.email(),
    profile: z.object({
      firstName: z.string(),
      lastName: z.string(),
      age: z.number()
    }),
    tags: z.array(z.string()),
    scores: z.array(z.number())
  }) satisfies ZParentObject;

  describe('with dot-notation input', () => {
    it('should handle single-level paths', () => {
      const result = formPath(testSchema, 'name');
      expect(result.formName).toBe('name');
      expect(result.path).toEqual(['name']);
    });

    it('should handle nested object paths', () => {
      const result = formPath(testSchema, 'profile.firstName');
      expect(result.formName).toBe('profile.firstName');
      expect(result.path).toEqual(['profile', 'firstName']);
    });

    it('should handle array index paths', () => {
      const result = formPath(testSchema, 'tags.0');
      expect(result.formName).toBe('tags.0');
      expect(result.path).toEqual(['tags', 0]);

      const result2 = formPath(testSchema, 'scores.42');
      expect(result2.formName).toBe('scores.42');
      expect(result2.path).toEqual(['scores', 42]);
    });

    it('should parse numeric segments as numbers', () => {
      const result = formPath(testSchema, 'tags.123');
      expect(result.path[1]).toBe(123);
      expect(typeof result.path[1]).toBe('number');
    });

    it('should keep non-numeric segments as strings', () => {
      const result = formPath(testSchema, 'profile.age');
      expect(result.path[0]).toBe('profile');
      expect(typeof result.path[0]).toBe('string');
      expect(result.path[1]).toBe('age');
      expect(typeof result.path[1]).toBe('string');
    });
  });

  describe('with array input', () => {
    it('should handle single-element arrays', () => {
      const path: ['email'] = ['email'];
      const result = formPath(testSchema, path);
      expect(result.formName).toBe('email');
      expect(result.path).toEqual(['email']);
    });

    it('should handle nested object paths', () => {
      const path: ['profile', 'lastName'] = ['profile', 'lastName'];
      const result = formPath(testSchema, path);
      expect(result.formName).toBe('profile.lastName');
      expect(result.path).toEqual(['profile', 'lastName']);
    });

    it('should handle array index paths', () => {
      const path: ['tags', number] = ['tags', 5];
      const result = formPath(testSchema, path);
      expect(result.formName).toBe('tags.5');
      expect(result.path).toEqual(['tags', 5]);
    });

    it('should return a copy of the input array', () => {
      const path: ['profile', 'age'] = ['profile', 'age'];
      const result = formPath(testSchema, path);
      expect(result.path).toEqual(path);
      expect(result.path).not.toBe(path); // Should be a different array instance
    });

    it('should convert numbers to strings in formName', () => {
      const path: ['scores', number] = ['scores', 99];
      const result = formPath(testSchema, path);
      expect(result.formName).toBe('scores.99');
    });
  });

  describe('round-trip conversions', () => {
    it('should maintain consistency when converting from dot notation', () => {
      const dotPath = 'profile.firstName';
      const result1 = formPath(testSchema, dotPath);
      // Use the array path as input
      const result2 = formPath(
        testSchema,
        result1.path as ['profile', 'firstName']
      );
      expect(result2.formName).toBe(dotPath);
      expect(result2.path).toEqual(result1.path);
    });

    it('should maintain consistency when converting from array', () => {
      const arrayPath: ['tags', number] = ['tags', 10];
      const result1 = formPath(testSchema, arrayPath);
      // Use the formName as input
      const result2 = formPath(
        testSchema,
        result1.formName as `tags.${number}`
      );
      expect(result2.formName).toBe(result1.formName);
      expect(result2.path).toEqual(arrayPath);
    });
  });

  describe('edge cases', () => {
    it('should handle array field without index', () => {
      const result = formPath(testSchema, 'tags');
      expect(result.formName).toBe('tags');
      expect(result.path).toEqual(['tags']);
    });

    it('should handle object field without nested property', () => {
      const result = formPath(testSchema, 'profile');
      expect(result.formName).toBe('profile');
      expect(result.path).toEqual(['profile']);
    });

    it('should handle paths with zero index', () => {
      const result = formPath(testSchema, 'tags.0');
      expect(result.formName).toBe('tags.0');
      expect(result.path).toEqual(['tags', 0]);
      expect(result.path[1]).toBe(0);
      expect(typeof result.path[1]).toBe('number');
    });
  });

  describe('with refined types', () => {
    const refinedSchema = z.object({
      password: z.string().refine((val) => val.length >= 8),
      scores: z.array(z.number()).refine((arr) => arr.length > 0),
      profile: z
        .object({
          name: z.string()
        })
        .refine((obj) => obj.name !== '')
    }) satisfies ZParentObject;

    it('should handle paths to refined primitive fields', () => {
      const result = formPath(refinedSchema, 'password');
      expect(result.formName).toBe('password');
      expect(result.path).toEqual(['password']);
    });

    it('should handle paths to refined array fields', () => {
      const result = formPath(refinedSchema, 'scores.0');
      expect(result.formName).toBe('scores.0');
      expect(result.path).toEqual(['scores', 0]);
    });

    it('should handle paths to refined object fields', () => {
      const result = formPath(refinedSchema, 'profile.name');
      expect(result.formName).toBe('profile.name');
      expect(result.path).toEqual(['profile', 'name']);
    });
  });

  describe('runtime validation', () => {
    it('should throw error for non-existent field', () => {
      // @ts-expect-error Testing invalid path
      expect(() => formPath(testSchema, 'nonExistent')).toThrow(
        'Invalid path: "nonExistent" does not exist in schema'
      );
    });

    it('should throw error for array access on non-array field', () => {
      // @ts-expect-error Testing invalid path
      expect(() => formPath(testSchema, 'name.0')).toThrow(
        'Invalid path: Cannot index into non-array at depth 1'
      );
    });

    it('should throw error for object access on non-object field', () => {
      // @ts-expect-error Testing invalid path
      expect(() => formPath(testSchema, 'tags.firstName')).toThrow(
        'Invalid path: Not an object at depth 1'
      );
    });

    it('should throw error for non-existent nested property', () => {
      // @ts-expect-error Testing invalid path
      expect(() => formPath(testSchema, 'profile.nonExistent')).toThrow(
        'Invalid path: "nonExistent" does not exist at depth 1'
      );
    });

    it('should allow valid paths without errors', () => {
      expect(() => formPath(testSchema, 'name')).not.toThrow();
      expect(() => formPath(testSchema, 'profile.firstName')).not.toThrow();
      expect(() => formPath(testSchema, 'tags.0')).not.toThrow();
      expect(() => formPath(testSchema, ['scores', 5])).not.toThrow();
    });
  });

  describe('3-level deep schemas', () => {
    const deepSchema = z.object({
      // 3-level nested objects
      user: z.object({
        profile: z.object({
          name: z.string(),
          age: z.number(),
          email: z.email()
        }),
        settings: z.object({
          theme: z.enum(['light', 'dark']),
          notifications: z.boolean()
        })
      }),

      // Object containing arrays of primitives
      data: z.object({
        items: z.array(z.string()),
        scores: z.array(z.number())
      }),

      // Deep mixed nesting with arrays of primitives
      company: z.object({
        info: z.object({
          name: z.string(),
          employees: z.number()
        }),
        tags: z.array(z.string())
      })
    }) satisfies ZParentObject;

    describe('dot notation paths', () => {
      it('should handle 3-level object paths', () => {
        const result = formPath(deepSchema, 'user.profile.name');
        expect(result.formName).toBe('user.profile.name');
        expect(result.path).toEqual(['user', 'profile', 'name']);
      });

      it('should handle object.object.primitive paths', () => {
        const result = formPath(deepSchema, 'user.settings.theme');
        expect(result.formName).toBe('user.settings.theme');
        expect(result.path).toEqual(['user', 'settings', 'theme']);
      });

      it('should handle object.array.index paths', () => {
        const result = formPath(deepSchema, 'data.items.0');
        expect(result.formName).toBe('data.items.0');
        expect(result.path).toEqual(['data', 'items', 0]);
      });

      it('should handle complex nested paths', () => {
        const result = formPath(deepSchema, 'company.info.name');
        expect(result.formName).toBe('company.info.name');
        expect(result.path).toEqual(['company', 'info', 'name']);
      });

      it('should handle object.array paths', () => {
        const result = formPath(deepSchema, 'company.tags.0');
        expect(result.formName).toBe('company.tags.0');
        expect(result.path).toEqual(['company', 'tags', 0]);
      });
    });

    describe('array notation paths', () => {
      it('should handle 3-level array paths', () => {
        const path: ['user', 'profile', 'email'] = ['user', 'profile', 'email'];
        const result = formPath(deepSchema, path);
        expect(result.formName).toBe('user.profile.email');
        expect(result.path).toEqual(['user', 'profile', 'email']);
      });

      it('should handle mixed array/index paths', () => {
        const path: ['data', 'scores', number] = ['data', 'scores', 42];
        const result = formPath(deepSchema, path);
        expect(result.formName).toBe('data.scores.42');
        expect(result.path).toEqual(['data', 'scores', 42]);
      });

      it('should handle 3-level paths with arrays', () => {
        const path: ['company', 'tags', number] = ['company', 'tags', 5];
        const result = formPath(deepSchema, path);
        expect(result.formName).toBe('company.tags.5');
        expect(result.path).toEqual(['company', 'tags', 5]);
      });
    });

    describe('validation for 3-level paths', () => {
      it('should validate correct 3-level paths', () => {
        expect(() => formPath(deepSchema, 'user.profile.age')).not.toThrow();
        expect(() => formPath(deepSchema, 'data.items.10')).not.toThrow();
        expect(() =>
          formPath(deepSchema, 'company.info.employees')
        ).not.toThrow();
      });

      it('should throw for invalid 3-level paths', () => {
        // @ts-expect-error Testing invalid path
        expect(() => formPath(deepSchema, 'user.profile.invalid')).toThrow(
          'Invalid path: "invalid" does not exist at depth 2'
        );
      });

      it('should throw for paths exceeding 3 levels', () => {
        // @ts-expect-error Testing invalid path
        expect(() => formPath(deepSchema, 'user.profile.name.extra')).toThrow(
          'Invalid path: Maximum depth of 3 levels exceeded'
        );
      });

      it('should throw for invalid array access at depth 3', () => {
        // @ts-expect-error Testing invalid path
        expect(() => formPath(deepSchema, 'user.profile.0')).toThrow(
          'Invalid path: Cannot index into non-array at depth 2'
        );
      });
    });

    describe('2-level paths in 3-level schema', () => {
      it('should handle 1-level paths', () => {
        const result = formPath(deepSchema, 'user');
        expect(result.formName).toBe('user');
        expect(result.path).toEqual(['user']);
      });

      it('should handle 2-level paths', () => {
        const result = formPath(deepSchema, 'user.profile');
        expect(result.formName).toBe('user.profile');
        expect(result.path).toEqual(['user', 'profile']);
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle all field types in a complex schema', () => {
      const complexSchema = z.object({
        // Primitives
        id: z.string(),
        count: z.number(),
        isActive: z.boolean(),

        // Nested object
        user: z.object({
          email: z.email(),
          age: z.number()
        }),

        // Array
        items: z.array(z.string()),

        // Refined types
        username: z.string().refine((val) => val.length >= 3)
      }) satisfies ZParentObject;

      // Test primitive
      const result1 = formPath(complexSchema, 'id');
      expect(result1.formName).toBe('id');
      expect(result1.path).toEqual(['id']);

      // Test nested object
      const result2 = formPath(complexSchema, 'user.email');
      expect(result2.formName).toBe('user.email');
      expect(result2.path).toEqual(['user', 'email']);

      // Test array
      const result3 = formPath(complexSchema, ['items', 0]);
      expect(result3.formName).toBe('items.0');
      expect(result3.path).toEqual(['items', 0]);

      // Test refined
      const result4 = formPath(complexSchema, 'username');
      expect(result4.formName).toBe('username');
      expect(result4.path).toEqual(['username']);
    });
  });
});

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
