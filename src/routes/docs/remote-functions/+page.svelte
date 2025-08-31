<script lang="ts">
  import { processMarkdownSync } from '$docs/utils.js';
  import PageHeader from '$docs/components/PageHeader.svelte';
  import pageContent from './page.md?raw';

  const content = processMarkdownSync(pageContent, {
    showLineNumbers: true
  });
</script>

<svelte:head>
  <title>Remote Functions - skimpleton-form</title>
</svelte:head>

<main class="container mx-auto my-4 px-4">
  <PageHeader
    title="Remote Functions"
    description="Build modern forms with SvelteKit's remote functions for client-side interactivity"
    breadcrumbs={[
      { label: 'Docs', href: '/docs' },
      { label: 'Remote Functions' }
    ]}
  />
  <div class="prose">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html content}
  </div>
</main>
