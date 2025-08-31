<script lang="ts">
  import SignInForm from './SignInForm.svelte';
  import SignUpForm from './SignUpForm.svelte';
</script>

<main class="container mx-auto max-w-2xl p-6">
  <h1 class="mb-6 text-3xl font-bold">Authentication Demo</h1>

  <div class="space-y-4">
    <details name="auth-forms" open>
      <summary
        class="cursor-pointer rounded-lg bg-base-200 p-4 text-lg font-semibold transition-colors hover:bg-base-300"
      >
        Sign In
      </summary>
      <div class="mt-4 p-4">
        <SignInForm />
      </div>
    </details>

    <details name="auth-forms">
      <summary
        class="cursor-pointer rounded-lg bg-base-200 p-4 text-lg font-semibold transition-colors hover:bg-base-300"
      >
        Sign Up
      </summary>
      <div class="mt-4 p-4">
        <SignUpForm />
      </div>
    </details>
  </div>
</main>
