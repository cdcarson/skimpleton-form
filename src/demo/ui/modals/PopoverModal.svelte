<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    id: string;
    title: string;
    children: Snippet;
    footer?: Snippet;
  };
  let { id, children, title, footer }: Props = $props();
</script>

<dialog
  {id}
  popover
  closedby="any"
  class="inset-0 right-0 left-auto m-0 flex h-full w-80 max-w-full translate-x-full flex-col bg-white transition-all transition-discrete duration-300 backdrop:bg-black/0 backdrop:transition-all backdrop:transition-discrete backdrop:duration-300 open:translate-x-0 open:backdrop:bg-black/50 starting:open:translate-x-full starting:open:backdrop:bg-black/0"
>
  <header class="flex h-14 shrink-0 grow-0 items-center justify-between px-4">
    <h2 id={'modal-header-' + id}>
      {title}
    </h2>
    <button popovertarget={id} popoverTargetAction="hide">Close</button>
  </header>
  <div class="grow bg-pink-50 p-4 overflow-y-scroll">
    {@render children()}
  </div>
  {#if footer}
    <footer class="flex h-14 shrink-0 grow-0 items-center justify-between px-4">
      {@render footer()}
    </footer>
  {/if}
</dialog>

<style>
</style>
