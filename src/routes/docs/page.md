## Overview

skimpleton-form is a type-safe form validation library for SvelteKit that leverages Zod schemas for runtime validation and TypeScript for compile-time safety. It provides a complete solution for handling forms with server-side validation, client-side state management, and user feedback through flash messages.

## Key Features

- **Type-safe validation** with Zod schemas
- **Server-side handlers** for both actions and remote functions
- **Client-side state management** with reactive Svelte 5 runes
- **Flash message system** for user feedback
- **Redirecting and non-redirecting** form submission patterns
- **Progressive enhancement** - works without JavaScript
- **Full TypeScript support** with inferred types

## Installation

Install the package using your preferred package manager:

```bash
pnpm add skimpleton-form zod
# or
npm install skimpleton-form zod
```

Note: `zod` is a peer dependency and must be installed separately.

## Quick Start

Here's a simple example of a login form with validation:

#### 1. Define your schema

```typescript
// src/routes/login/schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export type LoginSchema = typeof loginSchema;
```

#### 2. Create the server handler

```typescript
// src/routes/login/+page.server.ts
import { createRedirectingActionHandler } from 'skimpleton-form';
import { loginSchema } from './schema';
import {
  getUserAccountByEmail,
  checkPassword,
  createUserSession
} from '$lib/authentication.server';

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const handler = createRedirectingActionHandler(
      loginSchema,
      event,
      formData
    );

    // Check if basic validation passed
    if (!handler.valid) {
      return handler.fail();
    }

    const { email, password } = handler.data;

    // Look up user account by email
    const account = await getUserAccountByEmail(email);
    if (!account) {
      // Set error on email field when user doesn't exist
      return handler.fail({
        email: `We could not find an account with the email ${email}`
      });
    }

    // Verify password...
    const validPassword = await checkPassword(password, account.passwordHash);
    if (!validPassword) {
      // Set error on password field when password is incorrect
      return handler.fail({
        password: 'Incorrect password'
      });
    }

    // Create session, set cookies, get saved redirect path, etc.
    const { profile, redirect } = await createUserSession(event, account.id);

    // Redirect on success
    return handler.redirect({
      message: `Welcome back ${profile.firstName}!`,
      location: redirect
    });
  }
};
```

#### 3. Build the client form

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { createRedirectingFormClientState } from 'skimpleton-form';
  import { loginSchema } from './schema';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Create reactive form state with default values
  const form = createRedirectingFormClientState(
    loginSchema,
    { email: '', password: '' }, // default values
    data.form // server state (if any)
  );

  // Optional: client-side submit handler
  const handleSubmit = (e: SubmitEvent) => {
    // Touch all fields to show any validation errors
    form.touchAll();

    // Prevent submission if invalid
    if (!form.valid) {
      e.preventDefault();
      return;
    }

    // Set submitting state (optional)
    form.submitting = true;
  };
</script>

<form method="POST" onsubmit={handleSubmit}>
  {#if form.success}
    <!-- Show success message before redirect -->
    <div class="alert alert-success">
      {form.success.message}
    </div>
  {/if}

  <div>
    <label for={form.controlId('email')}>Email</label>
    <input
      id={form.controlId('email')}
      type="email"
      name={form.controlName('email')}
      bind:value={form.data.email}
      onblur={() => form.touch('email')}
      aria-invalid={form.shownErrors.email ? 'true' : undefined}
      aria-describedby={form.shownErrors.email
        ? form.controlDescriptionId('email')
        : undefined}
    />
    {#if form.shownErrors.email}
      <span id={form.controlDescriptionId('email')} class="error">
        {form.shownErrors.email}
      </span>
    {/if}
  </div>

  <div>
    <label for={form.controlId('password')}>Password</label>
    <input
      id={form.controlId('password')}
      type="password"
      name={form.controlName('password')}
      bind:value={form.data.password}
      onblur={() => form.touch('password')}
      aria-invalid={form.shownErrors.password ? 'true' : undefined}
      aria-describedby={form.shownErrors.password
        ? form.controlDescriptionId('password')
        : undefined}
    />
    {#if form.shownErrors.password}
      <span id={form.controlDescriptionId('password')} class="error">
        {form.shownErrors.password}
      </span>
    {/if}
  </div>

  <button type="submit" disabled={form.submitting}>
    {form.submitting ? 'Logging in...' : 'Login'}
  </button>
</form>
```

## Core Concepts

### Form Schemas

skimpleton-form uses Zod schemas to define form structure and validation rules. The library supports:

- **Primitive types**: strings, numbers, booleans, dates
- **Arrays**: arrays of primitives or objects
- **Nested objects**: complex data structures
- **Custom validation**: using Zod's refinement methods

### Handler Types

The library provides two types of handlers for different use cases:

#### Redirecting Handlers

Used when you want to redirect after successful form submission (typical for login, create operations):

- `createRedirectingActionHandler` - for form actions
- `createRedirectingRemoteFunctionHandler` - for API endpoints

#### Non-Redirecting Handlers

Used when you want to stay on the same page and show success messages:

- `createNonRedirectingActionHandler` - for form actions
- `createNonRedirectingRemoteFunctionHandler` - for API endpoints

### Client State Management

Client-side form state is managed through reactive Svelte 5 runes:

```typescript
const form = createRedirectingFormClientState(schema, initialData);

// Access reactive fields
form.fields.email; // reactive value
form.errors.email; // reactive error message
form.touched.email; // reactive touched state
```

### Message System

The library includes a comprehensive message system for user feedback:

- **Flash Messages**: Server-side messages that persist across redirects
- **Application Messages**: Client-side messages with different types (success, error, warning, info)
- **AppMessage Component**: Ready-to-use Svelte component for displaying messages

```typescript
// Server-side
import { setFlashMessage } from 'skimpleton-form';

setFlashMessage(cookies, {
  type: 'success',
  text: 'Your changes have been saved!'
});

// Client-side
import { AppMessage } from 'skimpleton-form';
```

## Form Validation Flow

1. **Client-side validation** (optional) - Immediate feedback as users type
2. **Server-side validation** - Always performed for security
3. **Error handling** - Validation errors are returned to the client
4. **Success handling** - Redirect or show success message

## TypeScript Support

The library is fully typed with TypeScript. All form fields, errors, and handler functions are automatically typed based on your Zod schema:

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number()
});

// TypeScript knows these types automatically
const form = createRedirectingFormClientState(schema, data);
form.fields.name; // string
form.fields.age; // number
form.errors.name; // string | undefined
```

## Next Steps

- Form Actions - Handle forms with SvelteKit form actions
- Remote Functions - Use remote functions for modern forms
- Forms Guide (coming soon) - Learn about form validation and utilities
- Server Handlers (coming soon) - Detailed guide on server-side handlers
- Client State (coming soon) - Managing form state on the client
- Messages (coming soon) - Using the message system
- API Reference (coming soon) - Complete API documentation
