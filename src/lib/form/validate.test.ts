import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validate } from './validate.js';
import type { ZFormObject } from './types.js';

describe('validate', () => {
  it('returns empty object for valid data', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0)
    }) satisfies ZFormObject;

    const data = {
      name: 'John',
      age: 25
    };

    const errors = validate(schema, data);
    expect(errors).toEqual({});
  });

  it('returns errors for invalid primitive fields', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.number().min(18, 'Must be 18 or older')
    }) satisfies ZFormObject;

    const data = {
      name: '',
      age: 16
    };

    const errors = validate(schema, data);
    expect(errors.name).toBe('Name is required');
    expect(errors.age).toBe('Must be 18 or older');
  });

  it('returns errors for nested objects', () => {
    const schema = z.object({
      profile: z.object({
        email: z.string().email('Invalid email'),
        phone: z.string().min(10, 'Phone must be at least 10 characters')
      })
    }) satisfies ZFormObject;

    const data = {
      profile: {
        email: 'not-an-email',
        phone: '123'
      }
    };

    const errors = validate(schema, data);
    expect(errors['profile.email']).toBe('Invalid email');
    expect(errors['profile.phone']).toBe(
      'Phone must be at least 10 characters'
    );
  });

  it('returns errors for deeply nested objects', () => {
    const schema = z.object({
      settings: z.object({
        notifications: z.object({
          email: z.boolean(),
          sms: z.boolean()
        })
      })
    }) satisfies ZFormObject;

    const data = {
      settings: {
        notifications: {
          email: 'yes' as unknown as boolean, // Invalid boolean value
          sms: true
        }
      }
    };

    const errors = validate(schema, data);
    expect(errors['settings.notifications.email']).toBeDefined();
  });

  it('returns errors for arrays', () => {
    const schema = z.object({
      tags: z.array(z.string().min(1, 'Tag cannot be empty'))
    }) satisfies ZFormObject;

    const data = {
      tags: ['valid', '', 'another']
    };

    const errors = validate(schema, data);
    expect(errors['tags.1']).toBe('Tag cannot be empty');
  });

  it('handles mixed validation with primitives, objects, and arrays', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name required'),
      profile: z.object({
        age: z.number().min(0, 'Age must be positive')
      }),
      hobbies: z.array(z.string().min(1, 'Hobby cannot be empty'))
    }) satisfies ZFormObject;

    const data = {
      name: '',
      profile: {
        age: -5
      },
      hobbies: ['reading', '']
    };

    const errors = validate(schema, data);
    expect(errors.name).toBe('Name required');
    expect(errors['profile.age']).toBe('Age must be positive');
    expect(errors['hobbies.1']).toBe('Hobby cannot be empty');
  });

  it('only returns the first error for each field', () => {
    const schema = z.object({
      email: z
        .string()
        .min(1, 'Email is required')
        .email('Must be a valid email')
    }) satisfies ZFormObject;

    const data = {
      email: '' // This will trigger both validations
    };

    const errors = validate(schema, data);
    expect(errors.email).toBe('Email is required');
    expect(Object.keys(errors).length).toBe(1);
  });
});
