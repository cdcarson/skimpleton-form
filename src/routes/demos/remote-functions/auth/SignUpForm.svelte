<script lang="ts">
  import { goto } from '$app/navigation';
  import { ClientFormState } from '$lib/form/client.svelte.js';
  import { AppMessageService } from '$lib/message/app-message.svelte.js';
  import { signUp } from './data.remote.js';
  import { signUpSchema } from './schemas.js';
  const msg = AppMessageService.get();
  let result = $derived(signUp.result);
  const form = new ClientFormState(
    signUpSchema,
    {
      name: '',
      email: '',
      password: '',
      remember: true
    },
    signUp.result
  );
</script>

<form
  {...signUp.enhance(async ({ submit }) => {
    try {
      if (!form.valid) {
        msg.error('Please correct the error(s).');
        return;
      }
      await submit();
      if (!result) {
        console.log('Missing result in sign up form');
        msg.clear();
        return;
      }
      if (result.success) {
        console.log('result', result);
        msg.success(result.success.message);
        await goto(result.success.location);
        return;
      }
      form.errors = result.errors;
      msg.error('Please correct the error(s).');
    } catch (error) {
      console.error(error);
      msg.clear();
    }
  })}
  class="flex flex-col gap-4"
>
  <div class="space-y-1">
    <label for={form.controlId('name')} class="block">Name</label>
    <input
      type="text"
      name={form.controlName('name')}
      id={form.controlId('name')}
      bind:value={form.data.name}
      placeholder="Your full name"
      class="input"
      class:input-error={form.shownErrors.name}
      aria-describedby={form.controlId('name') + '-description'}
    />
    <div class="text-sm" id={form.controlId('name') + '-description'}>
      {#if form.shownErrors.name}
        <span class="text-red-700 dark:text-red-300"
          >{form.shownErrors.name}</span
        >
      {:else}
        <span class="text-gray-700 dark:text-gray-300"
          >Enter your full name.</span
        >
      {/if}
    </div>
  </div>
  <div class="space-y-1">
    <label for={form.controlId('email')} class="block">Email</label>
    <input
      type="email"
      name={form.controlName('email')}
      id={form.controlId('email')}
      bind:value={form.data.email}
      placeholder="Email address"
      class="input"
      class:input-error={form.shownErrors.email}
      aria-describedby={form.controlId('email') + '-description'}
    />
    <div class="text-sm" id={form.controlId('email') + '-description'}>
      {#if form.shownErrors.email}
        <span class="text-red-700 dark:text-red-300"
          >{form.shownErrors.email}</span
        >
      {:else}
        <span class="text-gray-700 dark:text-gray-300"
          >Enter your email address.</span
        >
      {/if}
    </div>
  </div>
  <div class="space-y-1">
    <label for={form.controlId('password')} class="block">Choose Password</label
    >
    <input
      type="password"
      name={form.controlName('password')}
      id={form.controlId('password')}
      bind:value={form.data.password}
      placeholder="Choose a password"
      class="input"
      class:input-error={form.shownErrors.password}
      aria-describedby={form.controlId('password') + '-description'}
    />
    <div class="text-sm" id={form.controlId('password') + '-description'}>
      {#if form.shownErrors.password}
        <span class="text-red-700 dark:text-red-300"
          >{form.shownErrors.password}</span
        >
      {:else}
        <span class="text-gray-700 dark:text-gray-300"
          >Your password must be at least 8 characters long.</span
        >
      {/if}
    </div>
  </div>

  <div class="space-y-1">
    <label class="label" for={form.controlId('remember')}>
      <input
        type="checkbox"
        name={form.controlName('remember')}
        id={form.controlId('remember')}
        bind:checked={form.data.remember}
        class="checkbox checkbox-primary"
      />
      Remember me on this device.
    </label>
  </div>
  <div class="flex justify-end">
    <button type="submit" class="btn btn-primary" disabled={form.submitting}
      >Sign Up</button
    >
  </div>
</form>
