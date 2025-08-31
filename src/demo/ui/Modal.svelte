<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    id: string;
    children: Snippet;
  };

  let { title, children, id }: Props = $props();
</script>

<dialog {id}>
  <header>
    <h2>{title}</h2>
    <button popovertarget={id}>Close</button>
  </header>
  <div>
    {@render children()}
  </div>
</dialog>
