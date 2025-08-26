import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { getFormDataArrayLength, readFormData } from './form-data.js';
import type { ZFormObject } from './types.js';

describe('getFormDataArrayLength', () => {
  it('returns 0 for non-existent arrays', () => {
    const formData = new FormData();
    expect(getFormDataArrayLength(formData, 'tags')).toBe(0);
  });

  it('counts array elements correctly', () => {
    const formData = new FormData();
    formData.append('tags.0', 'first');
    formData.append('tags.1', 'second');
    formData.append('tags.2', 'third');

    expect(getFormDataArrayLength(formData, 'tags')).toBe(3);
  });

  it('handles sparse arrays correctly', () => {
    const formData = new FormData();
    formData.append('tags.0', 'first');
    formData.append('tags.5', 'sixth');
    formData.append('tags.10', 'eleventh');

    expect(getFormDataArrayLength(formData, 'tags')).toBe(11); // Max index + 1
  });

  it('ignores non-array fields', () => {
    const formData = new FormData();
    formData.append('tags', 'not-an-array');
    formData.append('tags.name', 'also-not-an-array');
    formData.append('tagsList', 'different-field');

    expect(getFormDataArrayLength(formData, 'tags')).toBe(0);
  });
});

describe('readFormData', () => {
  it('reads primitive fields', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      active: z.boolean()
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('name', 'John');
    formData.append('age', '25');
    formData.append('active', 'on');

    const result = readFormData(schema, formData);
    expect(result).toEqual({
      name: 'John',
      age: 25,
      active: true
    });
  });

  it('reads nested objects', () => {
    const schema = z.object({
      profile: z.object({
        firstName: z.string(),
        lastName: z.string(),
        age: z.number()
      })
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('profile.firstName', 'Jane');
    formData.append('profile.lastName', 'Doe');
    formData.append('profile.age', '30');

    const result = readFormData(schema, formData);
    expect(result).toEqual({
      profile: {
        firstName: 'Jane',
        lastName: 'Doe',
        age: 30
      }
    });
  });

  it('reads deeply nested objects (3 levels)', () => {
    const schema = z.object({
      settings: z.object({
        notifications: z.object({
          email: z.boolean(),
          sms: z.boolean()
        })
      })
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('settings.notifications.email', 'on');
    formData.append('settings.notifications.sms', '');

    const result = readFormData(schema, formData);
    expect(result).toEqual({
      settings: {
        notifications: {
          email: true,
          sms: false
        }
      }
    });
  });

  it('reads arrays', () => {
    const schema = z.object({
      tags: z.array(z.string()),
      scores: z.array(z.number())
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('tags.0', 'javascript');
    formData.append('tags.1', 'typescript');
    formData.append('scores.0', '95');
    formData.append('scores.1', '87');

    const result = readFormData(schema, formData);
    expect(result).toEqual({
      tags: ['javascript', 'typescript'],
      scores: [95, 87]
    });
  });

  it('reads nested arrays', () => {
    const schema = z.object({
      profile: z.object({
        hobbies: z.array(z.string())
      })
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('profile.hobbies.0', 'reading');
    formData.append('profile.hobbies.1', 'gaming');

    const result = readFormData(schema, formData);
    expect(result).toEqual({
      profile: {
        hobbies: ['reading', 'gaming']
      }
    });
  });

  it('handles missing fields', () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string()
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('required', 'present');
    // 'optional' is not in FormData

    const result = readFormData(schema, formData);
    expect(result).toEqual({
      required: 'present',
      optional: undefined
    });
  });

  it('handles empty strings', () => {
    const schema = z.object({
      name: z.string()
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('name', '');

    const result = readFormData(schema, formData);
    expect(result).toEqual({
      name: ''
    });
  });

  it('handles file inputs', () => {
    const schema = z.object({
      avatar: z.file()
    }) satisfies ZFormObject;

    const formData = new FormData();
    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
    formData.append('avatar', file);

    const result = readFormData(schema, formData);
    expect(result.avatar).toBeInstanceOf(File);
    expect((result.avatar as File).name).toBe('avatar.jpg');
  });

  it('handles refined schemas', () => {
    const schema = z.object({
      email: z
        .string()
        .email()
        .refine((val) => val.includes('@example.com')),
      age: z.number().min(18)
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('email', 'user@example.com');
    formData.append('age', '25');

    const result = readFormData(schema, formData);
    expect(result).toEqual({
      email: 'user@example.com',
      age: 25
    });
  });

  it('handles date fields', () => {
    const schema = z.object({
      birthDate: z.date()
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('birthDate', '2000-01-01');

    const result = readFormData(schema, formData);
    expect(result.birthDate).toBeInstanceOf(Date);
    // Check the date was parsed correctly
    const date = result.birthDate as Date;
    expect(date.toISOString().startsWith('2000-01-01')).toBe(true);
  });

  it('handles bigint fields', () => {
    const schema = z.object({
      largeNumber: z.bigint()
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('largeNumber', '9007199254740993');

    const result = readFormData(schema, formData);
    expect(result.largeNumber).toBe(BigInt('9007199254740993'));
  });
});
