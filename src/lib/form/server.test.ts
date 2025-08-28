import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRedirectingRemoteFunctionHandler,
  createNonRedirectingRemoteFunctionHandler,
  createRedirectingActionHandler,
  createNonRedirectingActionHandler
} from './server.js';
import { z } from 'zod';
import type { ZFormObject } from './types.js';
import type { RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

// Mock the SvelteKit imports
vi.mock('@sveltejs/kit', () => ({
  fail: vi.fn((status, data) => ({
    status,
    data,
    type: 'failure' as const
  })),
  redirect: vi.fn((status, location) => {
    const error = new Error(`Redirect to ${location}`) as Error & {
      status: number;
      location: string;
    };
    error.status = status;
    error.location = location;
    throw error;
  })
}));

// Mock the flash message module
vi.mock('$lib/message/flash-message.server.js', () => ({
  setFlashMessage: vi.fn()
}));

import { setFlashMessage } from '$lib/message/flash-message.server.js';

// Helper to create mock RequestEvent
const createMockRequestEvent = (isFetch = false): RequestEvent => {
  return {
    request: {
      headers: new Headers(isFetch ? { Accept: 'application/json' } : {})
    },
    cookies: {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(),
      serialize: vi.fn()
    },
    fetch: vi.fn(),
    getClientAddress: vi.fn(),
    locals: {},
    params: {},
    platform: undefined,
    route: { id: null },
    setHeaders: vi.fn(),
    url: new URL('http://localhost'),
    isDataRequest: false,
    isSubRequest: false,
    isRemoteRequest: false
  } as unknown as RequestEvent;
};

// Test schemas
const simpleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older')
}) satisfies ZFormObject;

const nestedSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required')
  }),
  tags: z.array(z.string())
}) satisfies ZFormObject;

describe('createRedirectingRemoteFunctionHandler', () => {
  let mockEvent: RequestEvent;
  let formData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = createMockRequestEvent();
    formData = new FormData();
  });

  it('should create handler with valid form data', () => {
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('age', '25');

    const handler = createRedirectingRemoteFunctionHandler(
      simpleSchema,
      formData,
      mockEvent
    );

    expect(handler.data).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    });
    expect(handler.errors).toEqual({});
    expect(handler.valid).toBe(true);
    expect(handler.submitted).toBe(true);
    expect(handler.fail).toBeDefined();
    expect(handler.redirect).toBeDefined();
  });

  it('should create handler with validation errors', () => {
    formData.append('name', '');
    formData.append('email', 'invalid-email');
    formData.append('age', '16');

    const handler = createRedirectingRemoteFunctionHandler(
      simpleSchema,
      formData,
      mockEvent
    );

    expect(handler.data).toEqual({
      name: '',
      email: 'invalid-email',
      age: 16
    });
    expect(handler.errors.name).toBe('Name is required');
    expect(handler.errors.email).toBe('Invalid email');
    expect(handler.errors.age).toBe('Must be 18 or older');
    expect(handler.valid).toBe(false);
    expect(handler.submitted).toBe(true);
  });

  describe('fail method', () => {
    it('should return failure state with existing errors', () => {
      formData.append('name', '');
      formData.append('email', 'invalid');
      formData.append('age', '16');

      const handler = createRedirectingRemoteFunctionHandler(
        simpleSchema,
        formData,
        mockEvent
      );

      const result = handler.fail();

      expect(result.valid).toBe(false);
      expect(result.submitted).toBe(true);
      expect(result.errors.name).toBe('Name is required');
      expect(result.errors.email).toBe('Invalid email');
      expect(result.touched.name).toBe(true);
      expect(result.touched.email).toBe(true);
      expect(result.touched.age).toBe(true);
    });

    it('should return failure state with custom errors', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createRedirectingRemoteFunctionHandler(
        simpleSchema,
        formData,
        mockEvent
      );

      const customErrors = {
        name: 'Name already exists',
        email: 'Email already registered'
      };

      const result = handler.fail(customErrors);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(customErrors);
      expect(result.touched.name).toBe(true);
      expect(result.touched.email).toBe(true);
    });
  });

  describe('redirect method', () => {
    it('should set flash message and throw redirect for non-fetch requests', () => {
      mockEvent = createMockRequestEvent(false);
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createRedirectingRemoteFunctionHandler(
        simpleSchema,
        formData,
        mockEvent
      );

      const successData = {
        message: 'Form submitted successfully',
        location: '/success'
      };

      expect(() => handler.redirect(successData)).toThrow();

      expect(setFlashMessage).toHaveBeenCalledWith(mockEvent, {
        type: 'success',
        message: 'Form submitted successfully'
      });

      expect(redirect).toHaveBeenCalledWith(StatusCodes.SEE_OTHER, '/success');
    });

    it('should return success state with redirect info for fetch requests', () => {
      mockEvent = createMockRequestEvent(true);
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createRedirectingRemoteFunctionHandler(
        simpleSchema,
        formData,
        mockEvent
      );

      const successData = {
        message: 'Form submitted successfully',
        location: '/success'
      };

      const result = handler.redirect(successData);

      expect(result.valid).toBe(true);
      expect(result.submitted).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.touched).toEqual({});
      expect(result.success).toEqual({
        message: 'Form submitted successfully',
        location: '/success',
        isRedirect: true
      });

      expect(setFlashMessage).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  it('should handle nested form data', () => {
    formData.append('profile.firstName', 'John');
    formData.append('profile.lastName', 'Doe');
    formData.append('tags.0', 'javascript');
    formData.append('tags.1', 'typescript');

    const handler = createRedirectingRemoteFunctionHandler(
      nestedSchema,
      formData,
      mockEvent
    );

    expect(handler.data).toEqual({
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      },
      tags: ['javascript', 'typescript']
    });
    expect(handler.valid).toBe(true);
  });
});

describe('createNonRedirectingRemoteFunctionHandler', () => {
  let formData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    formData = new FormData();
  });

  it('should create handler with valid form data', () => {
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('age', '25');

    const handler = createNonRedirectingRemoteFunctionHandler(
      simpleSchema,
      formData
    );

    expect(handler.data).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    });
    expect(handler.errors).toEqual({});
    expect(handler.valid).toBe(true);
    expect(handler.submitted).toBe(true);
    expect(handler.fail).toBeDefined();
    expect(handler.succeed).toBeDefined();
  });

  describe('fail method', () => {
    it('should return failure state with validation errors', () => {
      formData.append('name', '');
      formData.append('email', 'invalid');
      formData.append('age', '16');

      const handler = createNonRedirectingRemoteFunctionHandler(
        simpleSchema,
        formData
      );

      const result = handler.fail();

      expect(result.valid).toBe(false);
      expect(result.submitted).toBe(true);
      expect(result.errors.name).toBe('Name is required');
      expect(result.errors.email).toBe('Invalid email');
      expect(result.touched.name).toBe(true);
    });

    it('should return failure state with custom errors', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createNonRedirectingRemoteFunctionHandler(
        simpleSchema,
        formData
      );

      const customErrors = {
        email: 'This email is already taken'
      };

      const result = handler.fail(customErrors);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(customErrors);
    });
  });

  describe('succeed method', () => {
    it('should return success state with message', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createNonRedirectingRemoteFunctionHandler(
        simpleSchema,
        formData
      );

      const result = handler.succeed({
        message: 'Profile updated successfully'
      });

      expect(result.valid).toBe(true);
      expect(result.submitted).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.touched).toEqual({});
      expect(result.success).toEqual({
        message: 'Profile updated successfully',
        isRedirect: false
      });
    });

    it('should return success state with custom data', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      type SuccessData = {
        userId: number;
        token: string;
      };

      const handler = createNonRedirectingRemoteFunctionHandler<
        typeof simpleSchema,
        SuccessData
      >(simpleSchema, formData);

      const result = handler.succeed({
        message: 'Login successful',
        userId: 123,
        token: 'abc-123'
      });

      expect(result.valid).toBe(true);
      expect(result.success).toEqual({
        message: 'Login successful',
        userId: 123,
        token: 'abc-123',
        isRedirect: false
      });
    });

    it('should handle succeed without additional data', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createNonRedirectingRemoteFunctionHandler(
        simpleSchema,
        formData
      );

      const result = handler.succeed({
        message: 'Success'
      });

      expect(result.success).toEqual({
        message: 'Success',
        isRedirect: false
      });
    });
  });
});

describe('createRedirectingActionHandler', () => {
  let mockEvent: RequestEvent;
  let formData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = createMockRequestEvent();
    formData = new FormData();
  });

  it('should create handler with valid form data', () => {
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('age', '25');

    const handler = createRedirectingActionHandler(
      simpleSchema,
      mockEvent,
      formData
    );

    expect(handler.data).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    });
    expect(handler.errors).toEqual({});
    expect(handler.valid).toBe(true);
    expect(handler.submitted).toBe(true);
  });

  describe('fail method', () => {
    it('should return ActionFailure with default status', () => {
      formData.append('name', '');
      formData.append('email', 'invalid');
      formData.append('age', '16');

      const handler = createRedirectingActionHandler(
        simpleSchema,
        mockEvent,
        formData
      );

      const result = handler.fail();

      expect(fail).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST, {
        data: handler.data,
        errors: handler.errors,
        touched: expect.any(Object),
        valid: false,
        submitted: true
      });

      expect(result.status).toBe(StatusCodes.BAD_REQUEST);
      expect(result.data.valid).toBe(false);
      expect(result.data.errors.name).toBe('Name is required');
    });

    it('should return ActionFailure with custom status', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createRedirectingActionHandler(
        simpleSchema,
        mockEvent,
        formData
      );

      const customErrors = {
        email: 'Email not found'
      };

      const result = handler.fail(customErrors, StatusCodes.NOT_FOUND);

      expect(fail).toHaveBeenCalledWith(StatusCodes.NOT_FOUND, {
        data: handler.data,
        errors: customErrors,
        touched: expect.any(Object),
        valid: false,
        submitted: true
      });

      expect(result.status).toBe(StatusCodes.NOT_FOUND);
      expect(result.data.errors).toEqual(customErrors);
    });
  });

  describe('redirect method', () => {
    it('should set flash message and throw redirect for non-fetch requests', () => {
      mockEvent = createMockRequestEvent(false);
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createRedirectingActionHandler(
        simpleSchema,
        mockEvent,
        formData
      );

      const successData = {
        message: 'Action completed',
        location: '/dashboard'
      };

      expect(() => handler.redirect(successData)).toThrow();

      expect(setFlashMessage).toHaveBeenCalledWith(mockEvent, {
        type: 'success',
        message: 'Action completed'
      });

      expect(redirect).toHaveBeenCalledWith(
        StatusCodes.SEE_OTHER,
        '/dashboard'
      );
    });

    it('should use custom status code for redirect', () => {
      mockEvent = createMockRequestEvent(false);
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createRedirectingActionHandler(
        simpleSchema,
        mockEvent,
        formData
      );

      const successData = {
        message: 'Resource created',
        location: '/resource/123'
      };

      expect(() =>
        handler.redirect(successData, StatusCodes.CREATED)
      ).toThrow();

      expect(redirect).toHaveBeenCalledWith(
        StatusCodes.CREATED,
        '/resource/123'
      );
    });

    it('should return success state with redirect info for fetch requests', () => {
      mockEvent = createMockRequestEvent(true);
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createRedirectingActionHandler(
        simpleSchema,
        mockEvent,
        formData
      );

      const successData = {
        message: 'Action completed',
        location: '/dashboard'
      };

      const result = handler.redirect(successData);

      expect(result.valid).toBe(true);
      expect(result.success).toEqual({
        message: 'Action completed',
        location: '/dashboard',
        isRedirect: true
      });

      expect(setFlashMessage).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});

describe('createNonRedirectingActionHandler', () => {
  let mockEvent: RequestEvent;
  let formData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = createMockRequestEvent();
    formData = new FormData();
  });

  it('should create handler with valid form data', () => {
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('age', '25');

    const handler = createNonRedirectingActionHandler(
      simpleSchema,
      mockEvent,
      formData
    );

    expect(handler.data).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    });
    expect(handler.errors).toEqual({});
    expect(handler.valid).toBe(true);
    expect(handler.submitted).toBe(true);
  });

  describe('fail method', () => {
    it('should return ActionFailure with validation errors', () => {
      formData.append('name', '');
      formData.append('email', 'invalid');
      formData.append('age', '16');

      const handler = createNonRedirectingActionHandler(
        simpleSchema,
        mockEvent,
        formData
      );

      const result = handler.fail();

      expect(fail).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST, {
        data: handler.data,
        errors: handler.errors,
        touched: expect.any(Object),
        valid: false,
        submitted: true
      });

      expect(result.status).toBe(StatusCodes.BAD_REQUEST);
      expect(result.data.valid).toBe(false);
    });

    it('should return ActionFailure with custom errors and status', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createNonRedirectingActionHandler(
        simpleSchema,
        mockEvent,
        formData
      );

      const customErrors = {
        name: 'This username is taken'
      };

      const result = handler.fail(customErrors, StatusCodes.CONFLICT);

      expect(fail).toHaveBeenCalledWith(StatusCodes.CONFLICT, {
        data: handler.data,
        errors: customErrors,
        touched: expect.any(Object),
        valid: false,
        submitted: true
      });

      expect(result.status).toBe(StatusCodes.CONFLICT);
      expect(result.data.errors).toEqual(customErrors);
    });
  });

  describe('succeed method', () => {
    it('should return success state with message', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      const handler = createNonRedirectingActionHandler(
        simpleSchema,
        mockEvent,
        formData
      );

      const result = handler.succeed({
        message: 'Data saved successfully'
      });

      expect(result.valid).toBe(true);
      expect(result.submitted).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.touched).toEqual({});
      expect(result.success).toEqual({
        message: 'Data saved successfully',
        isRedirect: false
      });
    });

    it('should return success state with typed custom data', () => {
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');
      formData.append('age', '25');

      type ApiResponse = {
        id: string;
        createdAt: Date;
      };

      const handler = createNonRedirectingActionHandler<
        typeof simpleSchema,
        ApiResponse
      >(simpleSchema, mockEvent, formData);

      const now = new Date();
      const result = handler.succeed({
        message: 'Record created',
        id: 'rec-123',
        createdAt: now
      });

      expect(result.valid).toBe(true);
      expect(result.success).toEqual({
        message: 'Record created',
        id: 'rec-123',
        createdAt: now,
        isRedirect: false
      });
    });
  });
});

describe('Edge cases and complex scenarios', () => {
  it('should handle empty FormData', () => {
    const formData = new FormData();
    const mockEvent = createMockRequestEvent();

    const handler = createRedirectingRemoteFunctionHandler(
      simpleSchema,
      formData,
      mockEvent
    );

    expect(handler.data).toEqual({
      name: undefined,
      email: undefined,
      age: undefined
    });
    expect(handler.valid).toBe(false);
    expect(Object.keys(handler.errors).length).toBeGreaterThan(0);
  });

  it('should handle deeply nested schemas', () => {
    const deepSchema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string(),
          age: z.number()
        })
      })
    }) satisfies ZFormObject;

    const formData = new FormData();
    formData.append('user.profile.name', 'John');
    formData.append('user.profile.age', '30');

    const handler = createNonRedirectingRemoteFunctionHandler(
      deepSchema,
      formData
    );

    expect(handler.data).toEqual({
      user: {
        profile: {
          name: 'John',
          age: 30
        }
      }
    });
    expect(handler.valid).toBe(true);
  });

  it('should handle arrays in form data', () => {
    const formData = new FormData();
    formData.append('profile.firstName', 'John');
    formData.append('profile.lastName', 'Doe');
    formData.append('tags.0', 'tag1');
    formData.append('tags.1', 'tag2');
    formData.append('tags.2', 'tag3');

    const handler = createRedirectingRemoteFunctionHandler(
      nestedSchema,
      formData,
      createMockRequestEvent()
    );

    expect(handler.data.tags).toHaveLength(3);
    expect(handler.data.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should handle partial data with defaults', () => {
    // Note: schemas with .default() are not part of ZFormObject type
    // but we can still test the runtime behavior
    const schemaWithDefaults = z.object({
      name: z.string().default('Anonymous'),
      count: z.number().default(0),
      active: z.boolean().default(false)
    });

    const formData = new FormData();
    formData.append('name', 'John');
    // count and active are not provided

    const handler = createNonRedirectingRemoteFunctionHandler(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schemaWithDefaults as any,
      formData
    );

    expect(handler.data.name).toBe('John');
    // Note: defaults are applied by Zod during validation
    expect(handler.valid).toBe(true);
  });

  it('should preserve all form data even when invalid', () => {
    const formData = new FormData();
    formData.append('name', 'J'); // Too short if min length is 2
    formData.append('email', 'not-an-email');
    formData.append('age', 'not-a-number');

    const strictSchema = z.object({
      name: z.string().min(2, 'Name too short'),
      email: z.string().email('Invalid email'),
      age: z.number()
    }) satisfies ZFormObject;

    const handler = createRedirectingActionHandler(
      strictSchema,
      createMockRequestEvent(),
      formData
    );

    expect(handler.data.name).toBe('J');
    expect(handler.data.email).toBe('not-an-email');
    expect(Number.isNaN(handler.data.age)).toBe(true);
    expect(handler.valid).toBe(false);
  });
});
