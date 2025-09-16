<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../cn.js';

  type Props = {
    id: string;
    title: string;
    body: Snippet<[close: () => void]>;
    position?: 'center' | 'right';
    class?: string;
  };

  let {
    id,
    title,
    body,
    position = 'center',
    class: className
  }: Props = $props();
  let dialog: HTMLDialogElement | undefined = $state();
  const close = () => {
    dialog?.hidePopover();
  };
</script>

<dialog
  {id}
  popover
  bind:this={dialog}
  closedby="any"
  class={cn(
    [
      position === 'center' &&
        'top-1/2 left-1/2 w-96 max-w-96 -translate-x-1/2 -translate-y-1/2 rounded border',
      position === 'right' &&
        'top-0 right-0 bottom-0 left-auto h-full w-96 max-w-96 border-l'
    ],
    'border-gray-300 bg-white dark:border-gray-700 dark:bg-black',
    'backdrop:bg-black/50',
    className
  )}
>
  <header
    class="flex h-14 shrink-0 grow-0 items-center justify-between border-b border-gray-300 px-4 dark:border-gray-700"
  >
    <h2 id={'modal-header-' + id} class="text-lg font-bold">
      {title}
    </h2>
    <button
      type="button"
      class="button button-ghost"
      popovertarget={id}
      popoverTargetAction="hide"
      tabindex="-1"
    >
      <span class="sr-only">Close</span>
      <span class="icon-[bi--x-lg]"></span>
    </button>
  </header>
  <div class="grow overflow-y-scroll p-4">
    {@render body(close)}
  </div>
</dialog>

<style>
  dialog[popover] {
    --duration: 500ms;
    transition:
      opacity var(--duration) ease-out,
      display var(--duration) allow-discrete,
      overlay var(--duration) allow-discrete;
    opacity: 0;
  }

  dialog[popover]:popover-open {
    opacity: 1;
    @starting-style {
      opacity: 0;
    }
  }

  dialog[popover]::backdrop {
    opacity: 0;
    transition: all var(--duration) ease-out;
  }

  dialog[popover]:popover-open::backdrop {
    opacity: 1;
  }

  @starting-style {
    dialog[popover]:popover-open::backdrop {
      opacity: 0;
    }
  }
</style>
