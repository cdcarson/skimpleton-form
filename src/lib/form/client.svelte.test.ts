import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  createRedirectingFormClientState,
  createNonRedirectingFormClientState
} from './client.svelte.js';
import type {
  ZFormObject,
  RedirectingFormState,
  NonRedirectingFormState
} from './types.js';

describe('createRedirectingFormClientState', () => {
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().min(18, 'Must be 18 or older')
  }) satisfies ZFormObject;

  const defaultData = {
    name: '',
    email: '',
    age: 0
  };

  it('creates state with default values when no initial state', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    expect(state.data).toEqual(defaultData);
    expect(state.submitted).toBe(false);
    expect(state.submitting).toBe(false);
    expect(state.errors).toEqual({
      name: 'Name is required',
      email: 'Invalid email',
      age: 'Must be 18 or older'
    });
    expect(state.touched).toEqual({});
    expect(state.valid).toBe(false);
    expect(state.shownErrors).toEqual({});
    expect(state.baseId).toMatch(/^skf-[a-z0-9]+$/);
  });

  it('creates state with initial state values', () => {
    const initialState: RedirectingFormState<typeof schema> = {
      submitted: true,
      data: {
        name: 'John',
        email: 'john@example.com',
        age: 25
      },
      errors: {
        name: 'External error'
      },
      touched: {},
      valid: false,
      success: undefined
    };

    const state = createRedirectingFormClientState(
      schema,
      defaultData,
      initialState
    );

    expect(state.data).toEqual(initialState.data);
    expect(state.submitted).toBe(true);
    expect(state.errors).toEqual({ name: 'External error' });
    expect(state.valid).toBe(false);
  });

  it('updates submitting state', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    expect(state.submitting).toBe(false);
    state.submitting = true;
    expect(state.submitting).toBe(true);
  });

  it('updates submitted state', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    expect(state.submitted).toBe(false);
    state.submitted = true;
    expect(state.submitted).toBe(true);
  });

  it('updates data and recalculates errors', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.data = {
      name: 'John',
      email: 'john@example.com',
      age: 25
    };

    expect(state.data).toEqual({
      name: 'John',
      email: 'john@example.com',
      age: 25
    });
    expect(state.errors).toEqual({});
    expect(state.valid).toBe(true);
  });

  it('handles external errors via setErrors', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.setErrors({
      email: 'Email already exists'
    });

    expect(state.errors).toEqual({
      name: 'Name is required',
      email: 'Email already exists',
      age: 'Must be 18 or older'
    });
  });

  it('automatically marks fields as touched when changed', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    // Initially nothing is touched
    expect(state.touched).toEqual({});
    expect(state.shownErrors).toEqual({});

    // Change a field value (still invalid)
    state.data = { ...state.data, email: 'notanemail' };
    expect(state.touched).toEqual({ email: true });
    expect(state.shownErrors).toEqual({ email: 'Invalid email' });

    // Change another field to a valid value
    state.data = { ...state.data, name: 'John' };
    expect(state.touched).toEqual({ name: true, email: true });
    expect(state.shownErrors).toEqual({
      email: 'Invalid email'
    });

    // Reset email to its original value - should no longer be touched
    state.data = { ...state.data, email: '' };
    expect(state.touched).toEqual({ name: true });
    expect(state.shownErrors).toEqual({}); // No errors shown because name is valid

    // Change name back to original value - nothing touched now
    state.data = { ...state.data, name: '' };
    expect(state.touched).toEqual({});
    expect(state.shownErrors).toEqual({});
  });

  it('touches all fields', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.touchAll();
    expect(state.touched).toEqual({
      name: true,
      email: true,
      age: true
    });
    expect(state.shownErrors).toEqual({
      name: 'Name is required',
      email: 'Invalid email',
      age: 'Must be 18 or older'
    });
  });

  it('untouches all fields', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.touchAll();
    state.untouchAll();
    expect(state.touched).toEqual({});
    expect(state.shownErrors).toEqual({});
  });

  it('generates control names', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    expect(state.controlName('name')).toBe('name');
    expect(state.controlName('email')).toBe('email');
  });

  it('generates control IDs', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);
    const baseId = state.baseId;

    expect(state.controlId('name')).toBe(`${baseId}-name`);
    expect(state.controlId('email')).toBe(`${baseId}-email`);
  });

  it('generates control description IDs', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);
    const baseId = state.baseId;

    expect(state.controlDescriptionId('name')).toBe(
      `${baseId}-name-description`
    );
    expect(state.controlDescriptionId('email')).toBe(
      `${baseId}-email-description`
    );
  });

  it('combines validation and external errors', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.data = {
      name: 'John',
      email: 'invalid',
      age: 25
    };

    state.setErrors({
      name: 'Name already taken'
    });

    expect(state.errors).toEqual({
      name: 'Name already taken',
      email: 'Invalid email'
    });
  });

  it('clears external errors when field data changes', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    // Set initial data
    state.data = {
      name: 'John',
      email: 'john@example.com',
      age: 25
    };

    // Add external error
    state.setErrors({
      email: 'Email already exists'
    });

    expect(state.errors).toEqual({
      email: 'Email already exists'
    });

    // Change the email field - should clear the external error
    state.data = {
      ...state.data,
      email: 'newemail@example.com'
    };

    expect(state.errors).toEqual({});
  });
});

describe('createNonRedirectingFormClientState', () => {
  const schema = z.object({
    username: z.string().min(3, 'Username too short'),
    password: z.string().min(8, 'Password too short')
  }) satisfies ZFormObject;

  const defaultData = {
    username: '',
    password: ''
  };

  type SuccessData = {
    userId: string;
    token: string;
  };

  it('creates state without success data', () => {
    const state = createNonRedirectingFormClientState(
      schema,
      defaultData,
      null
    );

    expect(state.data).toEqual(defaultData);
    expect(state.success).toBeUndefined();
    expect(state.submitted).toBe(false);
    expect(state.errors).toEqual({
      username: 'Username too short',
      password: 'Password too short'
    });
  });

  it('creates state with success data', () => {
    const initialState: NonRedirectingFormState<typeof schema, SuccessData> = {
      submitted: true,
      data: {
        username: 'johndoe',
        password: 'password123'
      },
      errors: {},
      touched: {},
      valid: true,
      success: {
        isRedirect: false,
        message: 'Success',
        userId: '123',
        token: 'abc-def-ghi'
      }
    };

    const state = createNonRedirectingFormClientState<
      typeof schema,
      SuccessData
    >(schema, defaultData, initialState);

    expect(state.data).toEqual(initialState.data);
    expect(state.success).toEqual({
      isRedirect: false,
      message: 'Success',
      userId: '123',
      token: 'abc-def-ghi'
    });
    expect(state.submitted).toBe(true);
    expect(state.valid).toBe(true);
  });

  it('updates success state', () => {
    const state = createNonRedirectingFormClientState<
      typeof schema,
      SuccessData
    >(schema, defaultData, null);

    expect(state.success).toBeUndefined();

    state.success = {
      isRedirect: false,
      message: 'Success',
      userId: '456',
      token: 'xyz-123-456'
    };

    expect(state.success).toEqual({
      isRedirect: false,
      message: 'Success',
      userId: '456',
      token: 'xyz-123-456'
    });
  });

  it('handles complex nested schemas', () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(1, 'Name required'),
        email: z.string().email('Invalid email')
      }),
      settings: z.object({
        notifications: z.boolean(),
        theme: z.enum(['light', 'dark'])
      })
    }) satisfies ZFormObject;

    const nestedDefault = {
      user: {
        name: '',
        email: ''
      },
      settings: {
        notifications: false,
        theme: 'light' as const
      }
    };

    const state = createNonRedirectingFormClientState(
      nestedSchema,
      nestedDefault,
      null
    );

    expect(state.data).toEqual(nestedDefault);
    expect(state.errors['user.name']).toBe('Name required');
    expect(state.errors['user.email']).toBe('Invalid email');

    // Change nested field - marks the parent object as touched
    state.data = {
      ...state.data,
      user: { ...state.data.user, name: 'J' }
    };
    // When we replace the entire user object, 'user' is marked as touched
    expect(state.touched['user']).toBe(true);
    expect(state.shownErrors).toEqual({}); // 'J' is valid (min length 1)
  });

  it('handles array schemas', () => {
    const arraySchema = z.object({
      tags: z.array(z.string().min(1, 'Tag cannot be empty')),
      scores: z.array(z.number().min(0, 'Score must be positive'))
    }) satisfies ZFormObject;

    const arrayDefault = {
      tags: ['', 'valid'],
      scores: [-1, 5]
    };

    const state = createNonRedirectingFormClientState(
      arraySchema,
      arrayDefault,
      null
    );

    expect(state.errors['tags.0']).toBe('Tag cannot be empty');
    expect(state.errors['scores.0']).toBe('Score must be positive');
    expect(state.errors['tags.1']).toBeUndefined();
    expect(state.errors['scores.1']).toBeUndefined();
  });

  it('maintains separate instances with unique baseIds', () => {
    const state1 = createNonRedirectingFormClientState(
      schema,
      defaultData,
      null
    );
    const state2 = createNonRedirectingFormClientState(
      schema,
      defaultData,
      null
    );

    expect(state1.baseId).not.toBe(state2.baseId);

    state1.data = { username: 'user1', password: 'password1' };
    state2.data = { username: 'user2', password: 'password2' };

    expect(state1.data.username).toBe('user1');
    expect(state2.data.username).toBe('user2');
  });
});

describe('client state edge cases', () => {
  const schema = z.object({
    field1: z.string(),
    field2: z.number()
  }) satisfies ZFormObject;

  const defaultData = {
    field1: '',
    field2: 0
  };

  it('handles nullable fields correctly', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.data = {
      field1: 'value',
      field2: 0
    };

    expect(state.valid).toBe(true);
    expect(state.errors).toEqual({});
  });

  it('clears external errors when field data changes', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.setErrors({
      field1: 'Server error'
    });

    expect(state.errors).toEqual({
      field1: 'Server error'
    });

    // Changing field1 should clear its external error
    state.data = {
      field1: 'new value',
      field2: 10
    };

    expect(state.errors).toEqual({});
  });

  it('preserves external errors for unchanged fields', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.setErrors({
      field1: 'Server error',
      field2: 'Another error'
    });

    // Only change field1, field2 error should remain
    state.data = {
      field1: 'new value',
      field2: 0 // unchanged
    };

    expect(state.errors).toEqual({
      field2: 'Another error'
    });
  });

  it('clears all external errors when set to empty object', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    state.setErrors({
      field1: 'Server error'
    });

    state.setErrors({});

    expect(state.errors).toEqual({});
  });

  it('marks fields with external errors as touched', () => {
    const state = createRedirectingFormClientState(schema, defaultData, null);

    // Initially nothing is touched
    expect(state.touched).toEqual({});
    expect(state.shownErrors).toEqual({});

    // Set external error on field1
    state.setErrors({
      field1: 'Server error'
    });

    // Field with external error should be marked as touched
    expect(state.touched.field1).toBe(true);
    expect(state.shownErrors.field1).toBe('Server error');

    // Change the field value - error should clear but field remains touched
    state.data = {
      ...state.data,
      field1: 'new value'
    };

    expect(state.touched.field1).toBe(true);
    expect(state.shownErrors).toEqual({});
  });

  it('shows external errors on fields that have not changed from initial value', () => {
    // This simulates the SignInForm scenario
    const signInSchema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(1, 'Password required')
    }) satisfies ZFormObject;

    const state = createRedirectingFormClientState(
      signInSchema,
      { email: '', password: '' },
      null
    );

    // Initially, validation errors exist but aren't shown (not touched)
    expect(state.errors).toEqual({
      email: 'Invalid email',
      password: 'Password required'
    });
    expect(state.touched).toEqual({});
    expect(state.shownErrors).toEqual({});

    // Simulate server response with external error
    // Email field still has its initial value ''
    state.setErrors({
      email: 'Email not found'
    });

    // The external error should show immediately
    expect(state.errors.email).toBe('Email not found');
    expect(state.touched.email).toBe(true); // Should be marked as touched
    expect(state.shownErrors.email).toBe('Email not found'); // Should show the error
  });

  it('shows external errors with empty validation errors', () => {
    // Test a form that starts with valid data
    const validSchema = z.object({
      email: z.string(),
      password: z.string()
    }) satisfies ZFormObject;

    const state = createRedirectingFormClientState(
      validSchema,
      { email: 'test@example.com', password: 'password123' },
      null
    );

    // Initially, no errors
    expect(state.errors).toEqual({});
    expect(state.touched).toEqual({});
    expect(state.shownErrors).toEqual({});

    // Set external error
    state.setErrors({
      email: 'Email not found'
    });

    // Should show the error
    expect(state.errors.email).toBe('Email not found');
    expect(state.touched.email).toBe(true);
    expect(state.shownErrors.email).toBe('Email not found');
  });

  it('simulates exact SignInForm flow with touchAll before submit', () => {
    const signInSchema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(1, 'Password required')
    }) satisfies ZFormObject;

    const state = createRedirectingFormClientState(
      signInSchema,
      { email: '', password: '' },
      null
    );

    // User clicks submit without entering anything
    // Form calls touchAll() to show validation errors
    state.touchAll();

    // Check validation errors are shown
    expect(state.shownErrors).toEqual({
      email: 'Invalid email',
      password: 'Password required'
    });

    // User enters valid data
    state.data = {
      email: 'user@example.com',
      password: 'mypassword'
    };

    // Errors should clear
    expect(state.errors).toEqual({});
    expect(state.shownErrors).toEqual({});

    // Form submits, server returns error
    state.setErrors({
      email: 'Email not found'
    });

    // External error should show
    expect(state.errors.email).toBe('Email not found');
    expect(state.touched.email).toBe(true);
    expect(state.shownErrors.email).toBe('Email not found');
  });

  it('resets forceTouched when external errors are set', () => {
    const signInSchema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(1, 'Password required')
    }) satisfies ZFormObject;

    const state = createRedirectingFormClientState(
      signInSchema,
      { email: '', password: '' },
      null
    );

    // Form calls touchAll() for validation
    state.touchAll();

    // All fields are touched
    expect(state.touched).toEqual({
      email: true,
      password: true
    });

    // User enters data to make form valid, then clears it
    state.data = { email: 'user@example.com', password: 'pass' };
    state.data = { email: '', password: '' }; // Back to initial

    // Server error comes back - setErrors should reset forceTouched
    state.setErrors({
      email: 'Custom server error'
    });

    // After setErrors, only email (with external error) should be touched
    // Password should NOT be touched anymore
    expect(state.errors).toEqual({
      email: 'Custom server error',
      password: 'Password required'
    });
    expect(state.touched).toEqual({
      email: true // Only email is touched due to external error
    });
    expect(state.shownErrors).toEqual({
      email: 'Custom server error'
      // Password error NOT shown because it's not touched
    });
  });
});
