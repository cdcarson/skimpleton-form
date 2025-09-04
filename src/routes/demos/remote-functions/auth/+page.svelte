<script lang="ts">
  import SignInForm from './SignInForm.svelte';
  import SignUpForm from './SignUpForm.svelte';
  import { uniqueId } from '$lib/form/utils.js';

  const signInModalId = uniqueId('sign-in-modal');
  const signUpModalId = uniqueId('sign-up-modal');
</script>

<main class="container mx-auto max-w-2xl p-6">
  <h1 class="mb-6 text-3xl font-bold">Authentication Demo</h1>

  <div class="space-y-4">
    <div class="rounded-lg bg-gray-100 p-8 text-center dark:bg-gray-800">
      <h2 class="mb-4 text-xl font-semibold">Sign in to your account</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Already have an account? Sign in to continue.
      </p>
      <button popovertarget={signInModalId} class="button button-primary">
        <span class="icon-[bi--box-arrow-in-right]"></span>
        <span>Sign In</span>
      </button>
    </div>

    <div class="rounded-lg bg-gray-100 p-8 text-center dark:bg-gray-800">
      <h2 class="mb-4 text-xl font-semibold">Create a new account</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        New here? Create an account to get started.
      </p>
      <button popovertarget={signUpModalId} class="button button-primary">
        <span class="icon-[bi--person-plus]"></span>
        <span>Sign Up</span>
      </button>
    </div>
  </div>
</main>

<SignInForm modalId={signInModalId} />
<SignUpForm modalId={signUpModalId} />
