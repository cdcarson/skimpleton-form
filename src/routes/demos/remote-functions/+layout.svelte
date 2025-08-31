<script lang="ts">
  import { resolve } from '$app/paths';
  import SignOutForm from './auth/SignOutForm.svelte';
  let { children, data } = $props();
</script>

<div class="container mx-auto border">
  <nav
    class=" flex h-14 items-center border-b justify-between bg-white/75 px-4 dark:bg-gray-900/75"
  >
    <a href={resolve('/demos/remote-functions')} class="btn btn-ghost">
      <span class="icon-[bi--check-circle-fill]"></span>
      Demo App: Remote Functions
    </a>
    {#if data.user}
      <SignOutForm formId="remote-functions-sign-out-form" />
      <button type="submit" form="remote-functions-sign-out-form" class="btn btn-ghost">Sign Out</button>
    {/if}
  </nav>
  <div class="py-4">
    {@render children()}
  </div>
</div>


