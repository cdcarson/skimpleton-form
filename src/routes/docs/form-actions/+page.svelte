<script lang="ts">
  import { processMarkdownSync } from '$docs/utils.js';
  import PageHeader from '$docs/components/PageHeader.svelte';
  import pageContent from './page.md?raw';

  const content = processMarkdownSync(pageContent, {
    showLineNumbers: true
  });
</script>

<svelte:head>
  <title>Form Actions - skimpleton-form</title>
</svelte:head>

<main class="container mx-auto my-4 px-4">
  <PageHeader
    title="Form Actions"
    description="Handle forms with SvelteKit form actions for progressive enhancement"
    breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Form Actions' }]}
  />
  <div class="prose">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html content}
  </div>
</main>
