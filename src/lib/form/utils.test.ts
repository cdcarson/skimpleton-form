import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  getFormDataArrayLength,
  readFormData,
  validate,
  formPath,
  cloneFormData,
  removeFiles
} from './utils.js';
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
  it('correctly reads boolean values', () => {
    const schema = z.object({
      remember: z.boolean()
    });
    const formData = new FormData();
    formData.append('remember', 'on');
    let data = readFormData(schema, formData);
    expect(data.remember).toBe(true);
    formData.delete('remember');
    data = readFormData(schema, formData);
    expect(data.remember).toBe(false);
  });
  it('correctly reads boolean values with a default value', () => {
    const schema = z.object({
      remember: z.boolean().default(true)
    });
    const formData = new FormData();
    formData.append('remember', 'on');
    let data = readFormData(schema, formData);
    expect(data.remember).toBe(true);
    formData.delete('remember');
    data = readFormData(schema, formData);
    expect(data.remember).toBe(false);
  });
  it('correctly reads boolean values with a prefault value', () => {
    const schema = z.object({
      remember: z.boolean().prefault(true)
    });
    const formData = new FormData();
    formData.append('remember', 'on');
    let data = readFormData(schema, formData);
    expect(data.remember).toBe(true);
    formData.delete('remember');
    data = readFormData(schema, formData);
    expect(data.remember).toBe(false);
  });
  it('correctly reads boolean values with nullable', () => {
    const schema = z.object({
      remember: z.boolean().nullable()
    });
    const formData = new FormData();
    formData.append('remember', 'on');
    let data = readFormData(schema, formData);
    expect(data.remember).toBe(true);
    formData.delete('remember');
    data = readFormData(schema, formData);
    expect(data.remember).toBe(false);
  });
  it('correctly reads boolean values with optional', () => {
    const schema = z.object({
      remember: z.boolean().optional()
    });
    const formData = new FormData();
    formData.append('remember', 'on');
    let data = readFormData(schema, formData);
    expect(data.remember).toBe(true);
    formData.delete('remember');
    data = readFormData(schema, formData);
    expect(data.remember).toBe(false);
  });
  it('correctly reads boolean values with refinement', () => {
    const schema = z.object({
      remember: z
        .boolean()
        .refine((val) => val, { message: 'Remember must be true' })
    });
    const formData = new FormData();
    formData.append('remember', 'on');
    let data = readFormData(schema, formData);
    expect(data.remember).toBe(true);
    formData.delete('remember');
    data = readFormData(schema, formData);
    expect(data.remember).toBe(false);
  });
  it('correctly reads arrays of boolean values', () => {
    const schema = z.object({
      flags: z.array(z.boolean())
    });
    const formData = new FormData();
    formData.append('flags.0', 'on');
    formData.append('flags.1', 'on');
    const data = readFormData(schema, formData);
    expect(data.flags).toEqual([true, true]);
  });

  it('correctly reads file values', () => {
    const schema = z.object({
      file: z.file()
    });
    const formData = new FormData();
    formData.append('file', new File(['ggh'], 'test.txt'));
    let data = readFormData(schema, formData);
    expect(data.file).toBeInstanceOf(File);
    formData.delete('file');
    data = readFormData(schema, formData);
    expect(data.file).toBe(undefined);
  });

  // String tests
  it('correctly reads string values', () => {
    const schema = z.object({
      name: z.string()
    });
    const formData = new FormData();
    formData.append('name', 'John Doe');
    let data = readFormData(schema, formData);
    expect(data.name).toBe('John Doe');

    formData.set('name', '');
    data = readFormData(schema, formData);
    expect(data.name).toBe('');
  });

  it('correctly reads string values with default value', () => {
    const schema = z.object({
      name: z.string().default('Anonymous')
    });
    const formData = new FormData();
    formData.append('name', 'John');
    let data = readFormData(schema, formData);
    expect(data.name).toBe('John');

    formData.delete('name');
    data = readFormData(schema, formData);
    expect(data.name).toBe(undefined);
  });

  it('correctly reads string values with prefault value', () => {
    const schema = z.object({
      name: z.string().prefault('Guest')
    });
    const formData = new FormData();
    formData.append('name', 'Alice');
    let data = readFormData(schema, formData);
    expect(data.name).toBe('Alice');

    formData.delete('name');
    data = readFormData(schema, formData);
    expect(data.name).toBe(undefined);
  });

  it('correctly reads string values with nullable', () => {
    const schema = z.object({
      name: z.string().nullable()
    });
    const formData = new FormData();
    formData.append('name', 'Bob');
    let data = readFormData(schema, formData);
    expect(data.name).toBe('Bob');

    formData.set('name', '');
    data = readFormData(schema, formData);
    expect(data.name).toBe('');
  });

  it('correctly reads string values with optional', () => {
    const schema = z.object({
      name: z.string().optional()
    });
    const formData = new FormData();
    formData.append('name', 'Charlie');
    let data = readFormData(schema, formData);
    expect(data.name).toBe('Charlie');

    formData.delete('name');
    data = readFormData(schema, formData);
    expect(data.name).toBe(undefined);
  });

  it('correctly reads string values with refinement', () => {
    const schema = z.object({
      name: z.string().refine((val) => val.length > 2, {
        message: 'Name must be longer than 2 characters'
      })
    });
    const formData = new FormData();
    formData.append('name', 'David');
    let data = readFormData(schema, formData);
    expect(data.name).toBe('David');

    formData.set('name', 'Ed');
    data = readFormData(schema, formData);
    expect(data.name).toBe('Ed');
  });

  it('correctly reads arrays of string values', () => {
    const schema = z.object({
      tags: z.array(z.string())
    });
    const formData = new FormData();
    formData.append('tags.0', 'tag1');
    formData.append('tags.1', 'tag2');
    formData.append('tags.2', 'tag3');
    const data = readFormData(schema, formData);
    expect(data.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  // String format tests (email, url, uuid, etc.)
  it('correctly reads email values', () => {
    const schema = z.object({
      email: z.email()
    });
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    let data = readFormData(schema, formData);
    expect(data.email).toBe('test@example.com');

    formData.set('email', 'invalid-email');
    data = readFormData(schema, formData);
    expect(data.email).toBe('invalid-email');
  });

  it('correctly reads url values', () => {
    const schema = z.object({
      website: z.url()
    });
    const formData = new FormData();
    formData.append('website', 'https://example.com');
    let data = readFormData(schema, formData);
    expect(data.website).toBe('https://example.com');

    formData.set('website', 'not-a-url');
    data = readFormData(schema, formData);
    expect(data.website).toBe('not-a-url');
  });

  it('correctly reads uuid values', () => {
    const schema = z.object({
      id: z.uuid()
    });
    const formData = new FormData();
    formData.append('id', '550e8400-e29b-41d4-a716-446655440000');
    let data = readFormData(schema, formData);
    expect(data.id).toBe('550e8400-e29b-41d4-a716-446655440000');

    formData.set('id', 'not-a-uuid');
    data = readFormData(schema, formData);
    expect(data.id).toBe('not-a-uuid');
  });

  it('correctly reads email values with default', () => {
    const schema = z.object({
      email: z.email().default('default@example.com')
    });
    const formData = new FormData();
    formData.append('email', 'user@test.com');
    let data = readFormData(schema, formData);
    expect(data.email).toBe('user@test.com');

    formData.delete('email');
    data = readFormData(schema, formData);
    expect(data.email).toBe(undefined);
  });

  it('correctly reads email values with prefault', () => {
    const schema = z.object({
      email: z.email().prefault('prefault@example.com')
    });
    const formData = new FormData();
    formData.append('email', 'user@test.com');
    let data = readFormData(schema, formData);
    expect(data.email).toBe('user@test.com');

    formData.delete('email');
    data = readFormData(schema, formData);
    expect(data.email).toBe(undefined);
  });

  it('correctly reads email values with nullable', () => {
    const schema = z.object({
      email: z.email().nullable()
    });
    const formData = new FormData();
    formData.append('email', 'user@test.com');
    let data = readFormData(schema, formData);
    expect(data.email).toBe('user@test.com');

    formData.set('email', '');
    data = readFormData(schema, formData);
    expect(data.email).toBe('');
  });

  it('correctly reads email values with optional', () => {
    const schema = z.object({
      email: z.email().optional()
    });
    const formData = new FormData();
    formData.append('email', 'user@test.com');
    let data = readFormData(schema, formData);
    expect(data.email).toBe('user@test.com');

    formData.delete('email');
    data = readFormData(schema, formData);
    expect(data.email).toBe(undefined);
  });

  it('correctly reads email values with refinement', () => {
    const schema = z.object({
      email: z.email().refine((val) => val.endsWith('@company.com'), {
        message: 'Must be company email'
      })
    });
    const formData = new FormData();
    formData.append('email', 'user@company.com');
    let data = readFormData(schema, formData);
    expect(data.email).toBe('user@company.com');

    formData.set('email', 'user@other.com');
    data = readFormData(schema, formData);
    expect(data.email).toBe('user@other.com');
  });

  it('correctly reads arrays of email values', () => {
    const schema = z.object({
      emails: z.array(z.email())
    });
    const formData = new FormData();
    formData.append('emails.0', 'user1@test.com');
    formData.append('emails.1', 'user2@test.com');
    formData.append('emails.2', 'user3@test.com');
    const data = readFormData(schema, formData);
    expect(data.emails).toEqual([
      'user1@test.com',
      'user2@test.com',
      'user3@test.com'
    ]);
  });

  it('correctly reads url values with modifiers', () => {
    const schema = z.object({
      website: z.url().optional(),
      backup: z.url().nullable(),
      default: z.url().default('https://default.com')
    });
    const formData = new FormData();
    formData.append('website', 'https://test.com');
    formData.append('backup', 'https://backup.com');
    formData.append('default', 'https://custom.com');
    const data = readFormData(schema, formData);
    expect(data.website).toBe('https://test.com');
    expect(data.backup).toBe('https://backup.com');
    expect(data.default).toBe('https://custom.com');
  });

  it('correctly reads arrays of url values', () => {
    const schema = z.object({
      links: z.array(z.url())
    });
    const formData = new FormData();
    formData.append('links.0', 'https://site1.com');
    formData.append('links.1', 'https://site2.com');
    const data = readFormData(schema, formData);
    expect(data.links).toEqual(['https://site1.com', 'https://site2.com']);
  });

  it('correctly reads uuid values with modifiers', () => {
    const schema = z.object({
      id: z.uuid().optional(),
      sessionId: z.uuid().nullable(),
      defaultId: z.uuid().default('550e8400-e29b-41d4-a716-446655440000')
    });
    const formData = new FormData();
    formData.append('id', '123e4567-e89b-12d3-a456-426614174000');
    formData.append('sessionId', '987e6543-e89b-12d3-a456-426614174000');
    formData.append('defaultId', '456e7890-e89b-12d3-a456-426614174000');
    const data = readFormData(schema, formData);
    expect(data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(data.sessionId).toBe('987e6543-e89b-12d3-a456-426614174000');
    expect(data.defaultId).toBe('456e7890-e89b-12d3-a456-426614174000');
  });

  it('correctly reads arrays of uuid values', () => {
    const schema = z.object({
      ids: z.array(z.uuid())
    });
    const formData = new FormData();
    formData.append('ids.0', '123e4567-e89b-12d3-a456-426614174000');
    formData.append('ids.1', '987e6543-e89b-12d3-a456-426614174000');
    const data = readFormData(schema, formData);
    expect(data.ids).toEqual([
      '123e4567-e89b-12d3-a456-426614174000',
      '987e6543-e89b-12d3-a456-426614174000'
    ]);
  });

  // Number tests
  it('correctly reads number values', () => {
    const schema = z.object({
      age: z.number()
    });
    const formData = new FormData();
    formData.append('age', '25');
    let data = readFormData(schema, formData);
    expect(data.age).toBe(25);

    formData.set('age', '0');
    data = readFormData(schema, formData);
    expect(data.age).toBe(0);

    formData.set('age', '-10');
    data = readFormData(schema, formData);
    expect(data.age).toBe(-10);

    formData.set('age', '3.14');
    data = readFormData(schema, formData);
    expect(data.age).toBe(3.14);
  });

  it('correctly reads number values with default value', () => {
    const schema = z.object({
      age: z.number().default(18)
    });
    const formData = new FormData();
    formData.append('age', '30');
    let data = readFormData(schema, formData);
    expect(data.age).toBe(30);

    formData.delete('age');
    data = readFormData(schema, formData);
    expect(data.age).toBe(undefined);
  });

  it('correctly reads number values with prefault value', () => {
    const schema = z.object({
      age: z.number().prefault(21)
    });
    const formData = new FormData();
    formData.append('age', '35');
    let data = readFormData(schema, formData);
    expect(data.age).toBe(35);

    formData.delete('age');
    data = readFormData(schema, formData);
    expect(data.age).toBe(undefined);
  });

  it('correctly reads number values with nullable', () => {
    const schema = z.object({
      age: z.number().nullable()
    });
    const formData = new FormData();
    formData.append('age', '40');
    let data = readFormData(schema, formData);
    expect(data.age).toBe(40);

    formData.delete('age');
    data = readFormData(schema, formData);
    expect(data.age).toBe(undefined);
  });

  it('correctly reads number values with optional', () => {
    const schema = z.object({
      age: z.number().optional()
    });
    const formData = new FormData();
    formData.append('age', '45');
    let data = readFormData(schema, formData);
    expect(data.age).toBe(45);

    formData.delete('age');
    data = readFormData(schema, formData);
    expect(data.age).toBe(undefined);
  });

  it('correctly reads number values with refinement', () => {
    const schema = z.object({
      age: z
        .number()
        .refine((val) => val >= 0, { message: 'Age must be positive' })
    });
    const formData = new FormData();
    formData.append('age', '50');
    let data = readFormData(schema, formData);
    expect(data.age).toBe(50);

    formData.set('age', '-5');
    data = readFormData(schema, formData);
    expect(data.age).toBe(-5);
  });

  it('correctly reads arrays of number values', () => {
    const schema = z.object({
      scores: z.array(z.number())
    });
    const formData = new FormData();
    formData.append('scores.0', '85');
    formData.append('scores.1', '92');
    formData.append('scores.2', '78');
    const data = readFormData(schema, formData);
    expect(data.scores).toEqual([85, 92, 78]);
  });

  // Date tests
  it('correctly reads date values', () => {
    const schema = z.object({
      birthday: z.date()
    });
    const formData = new FormData();
    formData.append('birthday', '2024-01-15');
    let data = readFormData(schema, formData);
    expect(data.birthday).toEqual(new Date('2024-01-15'));

    formData.set('birthday', '2023-12-31T23:59:59');
    data = readFormData(schema, formData);
    expect(data.birthday).toEqual(new Date('2023-12-31T23:59:59'));
  });

  it('correctly reads date values with default value', () => {
    const defaultDate = new Date('2024-01-01');
    const schema = z.object({
      birthday: z.date().default(defaultDate)
    });
    const formData = new FormData();
    formData.append('birthday', '2024-06-15');
    let data = readFormData(schema, formData);
    expect(data.birthday).toEqual(new Date('2024-06-15'));

    formData.delete('birthday');
    data = readFormData(schema, formData);
    expect(data.birthday).toBe(undefined);
  });

  it('correctly reads date values with prefault value', () => {
    const prefaultDate = new Date('2024-02-01');
    const schema = z.object({
      birthday: z.date().prefault(prefaultDate)
    });
    const formData = new FormData();
    formData.append('birthday', '2024-07-15');
    let data = readFormData(schema, formData);
    expect(data.birthday).toEqual(new Date('2024-07-15'));

    formData.delete('birthday');
    data = readFormData(schema, formData);
    expect(data.birthday).toBe(undefined);
  });

  it('correctly reads date values with nullable', () => {
    const schema = z.object({
      birthday: z.date().nullable()
    });
    const formData = new FormData();
    formData.append('birthday', '2024-08-15');
    let data = readFormData(schema, formData);
    expect(data.birthday).toEqual(new Date('2024-08-15'));

    formData.delete('birthday');
    data = readFormData(schema, formData);
    expect(data.birthday).toBe(undefined);
  });

  it('correctly reads date values with optional', () => {
    const schema = z.object({
      birthday: z.date().optional()
    });
    const formData = new FormData();
    formData.append('birthday', '2024-09-15');
    let data = readFormData(schema, formData);
    expect(data.birthday).toEqual(new Date('2024-09-15'));

    formData.delete('birthday');
    data = readFormData(schema, formData);
    expect(data.birthday).toBe(undefined);
  });

  it('correctly reads date values with refinement', () => {
    const schema = z.object({
      birthday: z.date().refine((val) => val < new Date(), {
        message: 'Birthday must be in the past'
      })
    });
    const formData = new FormData();
    formData.append('birthday', '2020-01-01');
    let data = readFormData(schema, formData);
    expect(data.birthday).toEqual(new Date('2020-01-01'));

    formData.set('birthday', '2025-01-01');
    data = readFormData(schema, formData);
    expect(data.birthday).toEqual(new Date('2025-01-01'));
  });

  it('correctly reads arrays of date values', () => {
    const schema = z.object({
      appointments: z.array(z.date())
    });
    const formData = new FormData();
    formData.append('appointments.0', '2024-01-01');
    formData.append('appointments.1', '2024-02-01');
    formData.append('appointments.2', '2024-03-01');
    const data = readFormData(schema, formData);
    expect(data.appointments).toEqual([
      new Date('2024-01-01'),
      new Date('2024-02-01'),
      new Date('2024-03-01')
    ]);
  });

  // BigInt tests
  it('correctly reads bigint values', () => {
    const schema = z.object({
      largeNumber: z.bigint()
    });
    const formData = new FormData();
    formData.append('largeNumber', '9007199254740991');
    let data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('9007199254740991'));

    formData.set('largeNumber', '-9007199254740991');
    data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('-9007199254740991'));

    formData.set('largeNumber', '0');
    data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('0'));
  });

  it('correctly reads bigint values with default value', () => {
    const schema = z.object({
      largeNumber: z.bigint().default(BigInt(100))
    });
    const formData = new FormData();
    formData.append('largeNumber', '999999999999');
    let data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('999999999999'));

    formData.delete('largeNumber');
    data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(undefined);
  });

  it('correctly reads bigint values with prefault value', () => {
    const schema = z.object({
      largeNumber: z.bigint().prefault(BigInt(200))
    });
    const formData = new FormData();
    formData.append('largeNumber', '888888888888');
    let data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('888888888888'));

    formData.delete('largeNumber');
    data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(undefined);
  });

  it('correctly reads bigint values with nullable', () => {
    const schema = z.object({
      largeNumber: z.bigint().nullable()
    });
    const formData = new FormData();
    formData.append('largeNumber', '777777777777');
    let data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('777777777777'));

    formData.delete('largeNumber');
    data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(undefined);
  });

  it('correctly reads bigint values with optional', () => {
    const schema = z.object({
      largeNumber: z.bigint().optional()
    });
    const formData = new FormData();
    formData.append('largeNumber', '666666666666');
    let data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('666666666666'));

    formData.delete('largeNumber');
    data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(undefined);
  });

  it('correctly reads bigint values with refinement', () => {
    const schema = z.object({
      largeNumber: z
        .bigint()
        .refine((val) => val > BigInt(0), { message: 'Must be positive' })
    });
    const formData = new FormData();
    formData.append('largeNumber', '555555555555');
    let data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('555555555555'));

    formData.set('largeNumber', '-100');
    data = readFormData(schema, formData);
    expect(data.largeNumber).toBe(BigInt('-100'));
  });

  it('correctly reads arrays of bigint values', () => {
    const schema = z.object({
      largeNumbers: z.array(z.bigint())
    });
    const formData = new FormData();
    formData.append('largeNumbers.0', '111111111111');
    formData.append('largeNumbers.1', '222222222222');
    formData.append('largeNumbers.2', '333333333333');
    const data = readFormData(schema, formData);
    expect(data.largeNumbers).toEqual([
      BigInt('111111111111'),
      BigInt('222222222222'),
      BigInt('333333333333')
    ]);
  });

  // Enum tests
  it('correctly reads enum values', () => {
    const schema = z.object({
      role: z.enum(['admin', 'user', 'guest'])
    });
    const formData = new FormData();
    formData.append('role', 'admin');
    let data = readFormData(schema, formData);
    expect(data.role).toBe('admin');

    formData.set('role', 'user');
    data = readFormData(schema, formData);
    expect(data.role).toBe('user');

    formData.set('role', 'guest');
    data = readFormData(schema, formData);
    expect(data.role).toBe('guest');
  });

  it('correctly reads enum values with default value', () => {
    const schema = z.object({
      role: z.enum(['admin', 'user', 'guest']).default('guest')
    });
    const formData = new FormData();
    formData.append('role', 'admin');
    let data = readFormData(schema, formData);
    expect(data.role).toBe('admin');

    formData.delete('role');
    data = readFormData(schema, formData);
    expect(data.role).toBe(undefined);
  });

  it('correctly reads enum values with prefault value', () => {
    const schema = z.object({
      role: z.enum(['admin', 'user', 'guest']).prefault('user')
    });
    const formData = new FormData();
    formData.append('role', 'admin');
    let data = readFormData(schema, formData);
    expect(data.role).toBe('admin');

    formData.delete('role');
    data = readFormData(schema, formData);
    expect(data.role).toBe(undefined);
  });

  it('correctly reads enum values with nullable', () => {
    const schema = z.object({
      role: z.enum(['admin', 'user', 'guest']).nullable()
    });
    const formData = new FormData();
    formData.append('role', 'admin');
    let data = readFormData(schema, formData);
    expect(data.role).toBe('admin');

    formData.set('role', '');
    data = readFormData(schema, formData);
    expect(data.role).toBe('');
  });

  it('correctly reads enum values with optional', () => {
    const schema = z.object({
      role: z.enum(['admin', 'user', 'guest']).optional()
    });
    const formData = new FormData();
    formData.append('role', 'user');
    let data = readFormData(schema, formData);
    expect(data.role).toBe('user');

    formData.delete('role');
    data = readFormData(schema, formData);
    expect(data.role).toBe(undefined);
  });

  it('correctly reads enum values with refinement', () => {
    const schema = z.object({
      role: z
        .enum(['admin', 'user', 'guest'])
        .refine((val) => val !== 'guest', { message: 'Guest role not allowed' })
    });
    const formData = new FormData();
    formData.append('role', 'admin');
    let data = readFormData(schema, formData);
    expect(data.role).toBe('admin');

    formData.set('role', 'guest');
    data = readFormData(schema, formData);
    expect(data.role).toBe('guest');
  });

  it('correctly reads arrays of enum values', () => {
    const schema = z.object({
      permissions: z.array(z.enum(['read', 'write', 'delete']))
    });
    const formData = new FormData();
    formData.append('permissions.0', 'read');
    formData.append('permissions.1', 'write');
    formData.append('permissions.2', 'delete');
    const data = readFormData(schema, formData);
    expect(data.permissions).toEqual(['read', 'write', 'delete']);
  });

  // Expanded File tests
  it('correctly reads file values with default value', () => {
    const defaultFile = new File(['default'], 'default.txt');
    const schema = z.object({
      document: z.file().default(defaultFile)
    });
    const formData = new FormData();
    const testFile = new File(['test'], 'test.pdf');
    formData.append('document', testFile);
    let data = readFormData(schema, formData);
    expect(data.document).toBe(testFile);
    expect(data.document?.name).toBe('test.pdf');

    formData.delete('document');
    data = readFormData(schema, formData);
    expect(data.document).toBe(undefined);
  });

  it('correctly reads file values with prefault value', () => {
    const prefaultFile = new File(['prefault'], 'prefault.txt');
    const schema = z.object({
      document: z.file().prefault(prefaultFile)
    });
    const formData = new FormData();
    const testFile = new File(['test'], 'test.pdf');
    formData.append('document', testFile);
    let data = readFormData(schema, formData);
    expect(data.document).toBe(testFile);

    formData.delete('document');
    data = readFormData(schema, formData);
    expect(data.document).toBe(undefined);
  });

  it('correctly reads file values with nullable', () => {
    const schema = z.object({
      document: z.file().nullable()
    });
    const formData = new FormData();
    const testFile = new File(['test'], 'test.pdf');
    formData.append('document', testFile);
    let data = readFormData(schema, formData);
    expect(data.document).toBe(testFile);

    formData.delete('document');
    data = readFormData(schema, formData);
    expect(data.document).toBe(undefined);
  });

  it('correctly reads file values with optional', () => {
    const schema = z.object({
      document: z.file().optional()
    });
    const formData = new FormData();
    const testFile = new File(['test'], 'test.pdf');
    formData.append('document', testFile);
    let data = readFormData(schema, formData);
    expect(data.document).toBe(testFile);

    formData.delete('document');
    data = readFormData(schema, formData);
    expect(data.document).toBe(undefined);
  });

  it('correctly reads file values with refinement', () => {
    const schema = z.object({
      document: z
        .file()
        .refine((file) => file.size > 0, { message: 'File cannot be empty' })
    });
    const formData = new FormData();
    const testFile = new File(['content'], 'test.pdf');
    formData.append('document', testFile);
    let data = readFormData(schema, formData);
    expect(data.document).toBe(testFile);

    const emptyFile = new File([], 'empty.pdf');
    formData.set('document', emptyFile);
    data = readFormData(schema, formData);
    expect(data.document).toBe(emptyFile);
  });

  it('correctly reads arrays of file values', () => {
    const schema = z.object({
      attachments: z.array(z.file())
    });
    const formData = new FormData();
    const file1 = new File(['content1'], 'file1.txt');
    const file2 = new File(['content2'], 'file2.txt');
    const file3 = new File(['content3'], 'file3.txt');
    formData.append('attachments.0', file1);
    formData.append('attachments.1', file2);
    formData.append('attachments.2', file3);
    const data = readFormData(schema, formData);
    expect(data.attachments).toEqual([file1, file2, file3]);
  });
});

describe('cloneFormData', () => {
  it('creates a copy of FormData with all entries', () => {
    const original = new FormData();
    original.append('name', 'John');
    original.append('age', '25');
    original.append('tags', 'tag1');
    original.append('tags', 'tag2');

    const cloned = cloneFormData(original);

    // Check that all entries are copied
    expect(cloned.get('name')).toBe('John');
    expect(cloned.get('age')).toBe('25');
    expect(cloned.getAll('tags')).toEqual(['tag1', 'tag2']);
  });

  it('creates an independent copy', () => {
    const original = new FormData();
    original.append('name', 'John');

    const cloned = cloneFormData(original);

    // Modify original
    original.append('name', 'Jane');
    original.append('email', 'test@example.com');

    // Cloned should not be affected
    expect(cloned.getAll('name')).toEqual(['John']);
    expect(cloned.has('email')).toBe(false);
  });

  it('handles File objects correctly', () => {
    const original = new FormData();
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    original.append('file', file);
    original.append('name', 'Test');

    const cloned = cloneFormData(original);

    const clonedFile = cloned.get('file');
    expect(clonedFile).toBe(file); // Should be the same File instance
    expect(cloned.get('name')).toBe('Test');
  });

  it('handles empty FormData', () => {
    const original = new FormData();
    const cloned = cloneFormData(original);

    expect(Array.from(cloned.keys())).toEqual([]);
  });
});

describe('removeFiles', () => {
  it('removes File objects at top level', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const data = {
      name: 'John',
      avatar: file,
      age: 25
    };

    const result = removeFiles(data);

    expect(result).toEqual({
      name: 'John',
      avatar: undefined,
      age: 25
    });
  });

  it('removes File objects in nested objects', () => {
    const file1 = new File(['content1'], 'profile.jpg');
    const file2 = new File(['content2'], 'doc.pdf');

    const data = {
      user: {
        name: 'Jane',
        profile: {
          avatar: file1,
          resume: file2,
          bio: 'Developer'
        }
      }
    };

    const result = removeFiles(data);

    expect(result).toEqual({
      user: {
        name: 'Jane',
        profile: {
          avatar: undefined,
          resume: undefined,
          bio: 'Developer'
        }
      }
    });
  });

  it('removes File objects in arrays', () => {
    const file1 = new File(['content1'], 'img1.jpg');
    const file2 = new File(['content2'], 'img2.jpg');

    const data = {
      title: 'Gallery',
      images: [file1, 'path/to/image', file2],
      tags: ['photo', 'gallery']
    };

    const result = removeFiles(data);

    expect(result).toEqual({
      title: 'Gallery',
      images: [undefined, 'path/to/image', undefined],
      tags: ['photo', 'gallery']
    });
  });

  it('preserves BigInt values', () => {
    const data = {
      id: BigInt(12345678901234567890n),
      count: BigInt(999),
      name: 'Test'
    };

    const result = removeFiles(data);

    expect(result).toEqual(data);
    expect(result.id).toBe(BigInt(12345678901234567890n));
    expect(result.count).toBe(BigInt(999));
  });

  it('preserves Date objects', () => {
    const now = new Date();
    const data = {
      created: now,
      updated: new Date('2024-01-01'),
      name: 'Event'
    };

    const result = removeFiles(data);

    expect(result).toEqual(data);
    expect(result.created).toBe(now);
    expect(result.updated).toEqual(new Date('2024-01-01'));
  });

  it('preserves RegExp, Map, and Set objects', () => {
    const regex = /test/gi;
    const map = new Map([
      ['key1', 'value1'],
      ['key2', 'value2']
    ]);
    const set = new Set([1, 2, 3]);

    const data = {
      pattern: regex,
      mapping: map,
      unique: set
    };

    const result = removeFiles(data);

    expect(result).toEqual(data);
    expect(result.pattern).toBe(regex);
    expect(result.mapping).toBe(map);
    expect(result.unique).toBe(set);
  });

  it('handles null and undefined values', () => {
    const data = {
      nullValue: null,
      undefinedValue: undefined,
      name: 'Test'
    };

    const result = removeFiles(data);

    expect(result).toEqual(data);
  });

  it('handles primitive values directly', () => {
    expect(removeFiles('string')).toBe('string');
    expect(removeFiles(123)).toBe(123);
    expect(removeFiles(true)).toBe(true);
    expect(removeFiles(false)).toBe(false);
    expect(removeFiles(null)).toBe(null);
    expect(removeFiles(undefined)).toBe(undefined);
  });

  it('handles complex mixed structures', () => {
    const file = new File(['content'], 'mixed.txt');
    const data = {
      user: {
        name: 'Alice',
        age: BigInt(30),
        joined: new Date('2023-01-01'),
        documents: [
          { type: 'passport', file: file },
          { type: 'license', file: null }
        ]
      },
      settings: {
        pattern: /^[a-z]+$/,
        uploads: [file, file]
      }
    };

    const result = removeFiles(data);

    expect(result).toEqual({
      user: {
        name: 'Alice',
        age: BigInt(30),
        joined: new Date('2023-01-01'),
        documents: [
          { type: 'passport', file: undefined },
          { type: 'license', file: null }
        ]
      },
      settings: {
        pattern: /^[a-z]+$/,
        uploads: [undefined, undefined]
      }
    });
  });
});

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
  }) satisfies ZFormObject;

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
    }) satisfies ZFormObject;

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
    }) satisfies ZFormObject;

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
      }) satisfies ZFormObject;

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
