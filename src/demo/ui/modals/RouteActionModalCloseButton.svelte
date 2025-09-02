<script lang="ts">
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import type { RouteActionModalCloseOptions } from './shared.js';

  type Props = {
    children: Snippet;
  } & RouteActionModalCloseOptions;
  let {
    closeModal,
    closeHref = page.url.pathname,
    children,
    closeDisabled = false
  }: Props = $props();
</script>

<a
  href={closeHref}
  class="btn button-background"
  class:disabled={closeDisabled}
  onclick={(e) => {
    e.preventDefault();
    if (!closeDisabled) {
      closeModal();
    }
  }}
  aria-label="Close modal"
>
  {@render children()}
</a>
