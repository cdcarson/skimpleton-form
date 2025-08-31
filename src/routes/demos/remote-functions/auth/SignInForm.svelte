<script lang="ts">
  import { goto } from '$app/navigation';
  import { createRedirectingFormClientState } from '$lib/form/client.svelte.js';
  import ControlContainer from '$lib/ui/ControlContainer.svelte';
  import { AppMessageService } from '$lib/message/app-message.svelte.js';
  import { signIn } from './data.remote.js';
  import { signInSchema } from './schemas.js';
    import { tick } from 'svelte';
  const msg = AppMessageService.get();
  let result = $derived(signIn.result);
  const form = createRedirectingFormClientState(
    signInSchema,
    {
      email: '',
      password: '',
      remember: true
    },
    signIn.result || null
  );
 
  $inspect(result);
</script>

<form
  {...signIn.enhance(async ({ submit }) => {
    try {
      if (!form.valid) {
        msg.error('Please correct the error(s).');
        return;
      }
      await submit();
      if (!result) {
        console.log('Missing result in sign in form');
        msg.clear();
        return;
      }
      if (result.success) {
        console.log('result', result);
        msg.success(result.success.message);
        await goto(result.success.location);
        return;
      }
      form.externalErrors = result.errors;
      msg.error('Please correct the error(s).');
    } catch (error) {
      msg.clear();
    }
  })}
  class="flex flex-col gap-4"
>
  <ControlContainer class="space-y-2" schema={signInSchema} path="email" {form}>
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
  <ControlContainer class="space-y-2" schema={signInSchema} path="password" {form}>
    {#snippet children(id, name, error)}
      <label for={id} class="block">Password</label>
      <input
        type="password"
        {name}
        {id}
        bind:value={form.data.password}
        placeholder="Your password"
        class="input"
        class:input-error={error}
        onblur={() => form.touch('password')}
        aria-describedby={id + '-description'}
      />
      <div class="text-sm" id={id + '-description'}>
        {#if error}
          <span class="text-red-700 dark:text-red-300">{error}</span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300">
            Enter your password.
          </span>
        {/if}
      </div>
    {/snippet}
  </ControlContainer>

  <ControlContainer class="space-y-2" schema={signInSchema} path="remember" {form}>
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
    <button type="submit" class="btn btn-primary" disabled={form.submitting}>
      Sign In
    </button>
  </div>
</form>
