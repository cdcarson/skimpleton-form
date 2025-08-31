<script lang="ts">
  import SignInForm from './SignInForm.svelte';
  import SignUpForm from './SignUpForm.svelte';
</script>

<main class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-3xl font-bold mb-6">Authentication Demo</h1>
  
  <div class="space-y-4">
    <details name="auth-forms" open>
      <summary class="cursor-pointer font-semibold text-lg p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
        Sign In
      </summary>
      <div class="mt-4 p-4">
        <SignInForm />
      </div>
    </details>

    <details name="auth-forms">
      <summary class="cursor-pointer font-semibold text-lg p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
        Sign Up
      </summary>
      <div class="mt-4 p-4">
        <SignUpForm />
      </div>
    </details>
  </div>
</main>