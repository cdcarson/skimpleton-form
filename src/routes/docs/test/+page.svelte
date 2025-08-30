<script lang="ts">
  import { processMarkdownSync } from '$docs/utils-sync.js';
  import pageContent from './page.md?raw';

  const content = processMarkdownSync(pageContent, {
    showLineNumbers: true
  });
</script>

<svelte:head>
  <title>Test Docs</title>
</svelte:head>

<main class="container mx-auto my-4 px-4">
  <header class="mb-4">
    <h1 class="text-2xl font-bold">Test Docs</h1>
  </header>
  <div class="prose">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html content}
  </div>
</main>
