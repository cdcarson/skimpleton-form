<script lang="ts">
  import '../app.css';
  import { themeService } from '../docs/theme/theme-service.svelte.js';
  import ThemeDropdown from '../docs/theme/ThemeDropdown.svelte';

  let { children } = $props();
  
  // Get the appropriate highlight.js theme URL based on resolved theme
  const hljsThemeUrl = $derived(themeService.isDark 
    ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/a11y-dark.min.css'
    : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/a11y-light.min.css');
</script>

<svelte:head>
  <!-- Dynamically load highlight.js theme based on current theme -->
  <link rel="stylesheet" href={hljsThemeUrl}>
</svelte:head>

<div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <!-- Theme dropdown in top right -->
  <nav class="fixed top-0 right-0 z-50 h-14 left-0 flex justify-between items-center px-4">
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