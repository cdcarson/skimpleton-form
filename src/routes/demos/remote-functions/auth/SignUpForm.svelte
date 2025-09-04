<script lang="ts">
  import {
    ClientFormState,
    enhanceRemoteFunctionForm
  } from '$lib/form/client.svelte.js';
  import { signUp } from './data.remote.js';
  import { signUpSchema } from './schemas.js';
  import PopoverModal from '$demo/ui/modals/PopoverModal.svelte';

  type Props = {
    modalId: string;
  };
  let { modalId }: Props = $props();

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

<form {...enhanceRemoteFunctionForm(signUp, form)} class="flex flex-col gap-4">
  <PopoverModal id={modalId} title="Sign Up">
    <div class="space-y-1">
      <label for={form.controlId('name')} class="block">Name</label>
      <input
        type="text"
        name={form.controlName('name')}
        id={form.controlId('name')}
        bind:value={form.data.name}
        placeholder="Your full name"
        class="control"
        class:invalid={form.shownErrors.name}
        aria-describedby={form.controlId('name') + '-description'}
      />
      <div class="text-sm" id={form.controlId('name') + '-description'}>
        {#if form.shownErrors.name}
          <span class="text-red-700 dark:text-red-300">
            {form.shownErrors.name}
          </span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300">
            Enter your full name.
          </span>
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
      <label for={form.controlId('password')} class="block"
        >Choose Password</label
      >
      <input
        type="password"
        name={form.controlName('password')}
        id={form.controlId('password')}
        bind:value={form.data.password}
        placeholder="Choose a password"
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
            Your password must be at least 8 characters long.
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
        <span class="icon-[bi--person-plus]"></span>
        <span>Sign Up</span>
      </button>
    {/snippet}
  </PopoverModal>
</form>
