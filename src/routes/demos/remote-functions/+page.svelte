<script lang="ts">
  import { resolve } from '$app/paths';

  let { data } = $props();
</script>

<div class="px-4">
  <h1 class="mb-6 text-2xl font-bold">Remote Functions Demo</h1>

  <div class="rounded-lg bg-gray-100 p-8 dark:bg-gray-800">
    {#if data.registeredUser}
      <h2 class="mb-4 text-xl font-semibold">Welcome back!</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        You're signed in as {data.registeredUser.userAccount?.email}
      </p>
      <a
        href={resolve('/demos/remote-functions/lists')}
        class="button button-primary"
      >
        View Your Todo Lists
      </a>
    {:else}
      <h2 class="mb-4 text-xl font-semibold">Get Started</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Sign in to access your todo lists and explore the remote functions demo.
      </p>
      <a
        href={resolve('/demos/remote-functions/auth')}
        class="button button-primary"
      >
        Sign In or Register
      </a>
    {/if}
  </div>
</div>
