## Remote Functions with skimpleton-form

Remote functions are an experimental SvelteKit feature that allows you to call server functions directly from your components without creating explicit API endpoints. The skimpleton-form library provides handlers specifically designed to work with remote functions.

### Demo Applications

We've created two demo applications to showcase how to use skimpleton-form with remote functions:

#### [Redirecting Demo](/docs/remote-functions/redirecting)

A login form that redirects to another page on successful authentication. This pattern is useful for:

- Login forms
- Create operations that redirect to the new resource
- Multi-step forms that progress to the next step

#### [Non-Redirecting Demo](/docs/remote-functions/non-redirecting)

A contact form that stays on the same page and shows a success message. This pattern is useful for:

- Contact forms
- Newsletter subscriptions
- Inline editing
- Any form where you want to keep the user on the same page

### Key Differences from Form Actions

While form actions work with traditional HTML forms and progressive enhancement, remote functions:

- Are called directly from JavaScript
- Don't require a form submission
- Can return typed data beyond just HTML
- Are experimental and require configuration

### Handler Functions

The library provides two specialized handlers for remote functions:

- `createRedirectingRemoteFunctionHandler` - For forms that redirect after success
- `createNonRedirectingRemoteFunctionHandler` - For forms that stay on the same page

Both handlers provide:

- Automatic Zod schema validation
- Type-safe form data access
- Consistent error handling
- Success state management

### Note on Experimental Status

Remote functions are currently experimental in SvelteKit. The demos shown here simulate the remote function pattern using regular endpoints. When remote functions become stable, the migration will be straightforward as the handler API will remain the same.
