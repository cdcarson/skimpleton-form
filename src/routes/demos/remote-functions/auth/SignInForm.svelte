<script lang="ts">
  import {
    ClientFormState,
    enhanceRemoteFunctionForm
  } from '$lib/form/client.svelte.js';
  import { signIn } from './data.remote.js';
  import { signInSchema } from './schemas.js';
  import PopoverModal from '$demo/ui/modals/PopoverModal.svelte';

  type Props = {
    modalId: string;
  };
  let { modalId }: Props = $props();

  const form = new ClientFormState(
    signInSchema,
    {
      email: '',
      password: '',
      remember: true
    },
    signIn.result
  );
</script>

<form {...enhanceRemoteFunctionForm(signIn, form)} class="flex flex-col gap-4">
  <PopoverModal id={modalId} title="Sign In">
    <div class="space-y-1">
      <label for={form.controlId('email')} class="block">Email</label>
      <input
        type="email"
        name={form.controlName('email')}
        id={form.controlId('email')}
        bind:value={form.data.email}
        oninput={() => form.touch('email')}
        placeholder="Email address"
        class="control"
        class:invalid={form.shownErrors.email}
        aria-describedby={form.controlId('email') + '-description'}
      />
      <div class="text-sm" id={form.controlId('email') + '-description'}>
        {#if form.shownErrors.email}
          <span class="text-red-700 dark:text-red-300">
            {form.shownErrors.email}
          </span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300">
            Enter your email address.
          </span>
        {/if}
      </div>
    </div>

    <div class="space-y-1">
      <label for={form.controlId('password')} class="block">Password</label>
      <input
        type="password"
        name={form.controlName('password')}
        id={form.controlId('password')}
        bind:value={form.data.password}
        oninput={() => form.touch('password')}
        placeholder="Your password"
        class="control"
        class:invalid={form.shownErrors.password}
        aria-describedby={form.controlId('password') + '-description'}
      />
      <div class="text-sm" id={form.controlId('password') + '-description'}>
        {#if form.shownErrors.password}
          <span class="text-red-700 dark:text-red-300">
            {form.shownErrors.password}
          </span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300">
            Enter your password.
          </span>
        {/if}
      </div>
    </div>

    <div class="space-y-1">
      <label for={form.controlId('remember')}>
        <input
          type="checkbox"
          name={form.controlName('remember')}
          id={form.controlId('remember')}
          bind:checked={form.data.remember}
          oninput={() => form.touch('remember')}
          class="control"
        />
        Remember me on this device.
      </label>
    </div>

    {#snippet footer()}
      <button
        type="button"
        class="button"
        popovertarget={modalId}
        popoverTargetAction="hide"
      >
        <span>Cancel</span>
      </button>

      <button
        type="submit"
        class="button button-primary"
        disabled={form.submitting}
      >
        <span class="icon-[bi--box-arrow-in-right]"></span>
        <span>Sign In</span>
      </button>
    {/snippet}
  </PopoverModal>
</form>
