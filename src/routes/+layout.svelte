<script lang="ts">
  import AppMessage from '$lib/message/AppMessage.svelte';
  import '../app.css';
  import { themeService } from '../docs/theme/theme-service.svelte.js';
  import ThemeDropdown from '../docs/theme/ThemeDropdown.svelte';

  let { children, data } = $props();

  // Get the appropriate highlight.js theme URL based on resolved theme
  const hljsThemeUrl = $derived(
    themeService.isDark
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/a11y-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/a11y-light.min.css'
  );
</script>

<svelte:head>
  <!-- Dynamically load highlight.js theme based on current theme -->
  <link rel="stylesheet" href={hljsThemeUrl} />
</svelte:head>

<div
  class="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
>
  <!-- Theme dropdown in top right -->
  <nav
    class="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between bg-white/75 px-4 dark:bg-gray-900/75"
  >
    <a href="/" class="btn btn-ghost">
      <span class="icon-[bi--house-fill]"></span>
      Skimpleton Forms
    </a>
    <ThemeDropdown />
  </nav>
  <div class="pt-14">
    {@render children()}
  </div>
</div>

<AppMessage
  viewportPosition="bottom"
  flashMessage={data.flashMessage ?? undefined}
/>
