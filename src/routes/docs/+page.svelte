<script lang="ts">
  import { processMarkdownSync } from '$docs/utils.js';
  import PageHeader from '$docs/components/PageHeader.svelte';
  import pageContent from './page.md?raw';

  const content = processMarkdownSync(pageContent, {
    showLineNumbers: true
  });
</script>

<svelte:head>
  <title>skimpleton-form - Overview</title>
</svelte:head>

<main class="container mx-auto my-4 px-4">
  <PageHeader
    title="skimpleton-form"
    description="Type-safe form validation for SvelteKit"
    breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Overview' }]}
  />
  <div class="prose">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html content}
  </div>
</main>
