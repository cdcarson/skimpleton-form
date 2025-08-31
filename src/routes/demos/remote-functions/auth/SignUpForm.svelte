<script lang="ts">
  import { goto } from '$app/navigation';
  import { createRedirectingFormClientState } from '$lib/form/client.svelte.js';
  import ControlContainer from '$lib/ui/ControlContainer.svelte';
  import { AppMessageService } from '$lib/message/app-message.svelte.js';
  import { signUp } from './data.remote.js';
  import { signUpSchema } from './schemas.js';
  const msg = AppMessageService.get();
  const form = createRedirectingFormClientState(
    signUpSchema,
    {
      name: '',
      email: '',
      password: '',
      remember: true
    },
    signUp.result || null
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
      if (!signUp.result) {
        console.log('Missing result');
        msg.clear();
        return;
      }
      if (signUp.result.success) {
        msg.success(signUp.result.success.message);
        await goto(signUp.result.success.location);
        return;
      }
      form.externalErrors = signUp.result.errors;
      msg.error('Please correct the error(s).');
    } catch (error) {
      console.error(error);
      msg.clear();
    }
  })}
  class="flex flex-col gap-4"
>
  <ControlContainer class="space-y-2" schema={signUpSchema} path="name" {form}>
    {#snippet children(id, name, error)}
      <label for={id} class="block">Name</label>
      <input
        type="text"
        {name}
        {id}
        bind:value={form.data.name}
        placeholder="Your full name"
        class="input"
        class:input-error={error}
        onblur={() => form.touch('name')}
        aria-describedby={id + '-description'}
      />
      <div class="text-sm" id={id + '-description'}>
        {#if error}
          <span class="text-red-700 dark:text-red-300">{error}</span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300"
            >Enter your full name.</span
          >
        {/if}
      </div>
    {/snippet}
  </ControlContainer>
  <ControlContainer class="space-y-2" schema={signUpSchema} path="email" {form}>
    {#snippet children(id, name, error)}
      <label for={id} class="block">Email</label>
      <input
        type="email"
        {name}
        {id}
        bind:value={form.data.email}
        placeholder="Email address"
        class="input"
        class:input-error={error}
        onblur={() => form.touch('email')}
        aria-describedby={id + '-description'}
      />
      <div class="text-sm" id={id + '-description'}>
        {#if error}
          <span class="text-red-700 dark:text-red-300">{error}</span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300"
            >Enter your email address.</span
          >
        {/if}
      </div>
    {/snippet}
  </ControlContainer>
  <ControlContainer class="space-y-2" schema={signUpSchema} path="password" {form}>
    {#snippet children(id, name, error)}
      <label for={id} class="block">Choose Password</label>
      <input
        type="password"
        {name}
        {id}
        bind:value={form.data.password}
        placeholder="Choose a password"
        class="input"
        class:input-error={error}
        onblur={() => form.touch('password')}
        aria-describedby={id + '-description'}
      />
      <div class="text-sm" id={id + '-description'}>
        {#if error}
          <span class="text-red-700 dark:text-red-300">{error}</span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300"
            >Your password must be at least 8 characters long.</span
          >
        {/if}
      </div>
    {/snippet}
  </ControlContainer>

  <ControlContainer class="space-y-2" schema={signUpSchema} path="remember" {form}>
    {#snippet children(id, name, error)}
      <label class="label">
        <input
          type="checkbox"
          bind:checked={form.data.remember}
          class="checkbox checkbox-primary"
        />
        Remember me on this device.
      </label>
    {/snippet}
  </ControlContainer>
  <div class="flex justify-end">
    <button type="submit" class="btn btn-primary" disabled={form.submitting}>Sign Up</button>
  </div>
</form>
