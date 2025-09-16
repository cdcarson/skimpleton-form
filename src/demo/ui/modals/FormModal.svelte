<script lang="ts">
  import type { Snippet } from 'svelte';
  type Props = {
    id: string;
    title: string;
    body: Snippet<[close: () => void]>;
  };

  let { id, title, body }: Props = $props();
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
  class="top-1/2 left-1/2 w-96 max-w-96 -translate-x-1/2 -translate-y-1/2 rounded border border-gray-300 bg-white dark:border-gray-700 dark:bg-black"
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
    transition-behavior: allow-discrete;
    transition:
      opacity 500ms ease-out,
      display 600ms allow-discrete,
      overlay 600ms allow-discrete;
    opacity: 0;
  }

  dialog[popover]:popover-open {
    transition-behavior: allow-discrete;
    opacity: 1;
    @starting-style {
      opacity: 0;
    }
  }

  dialog[popover]::backdrop {
    opacity: 0;
    background-color: #0008;
    transition-behavior: allow-discrete;
    transition:
      opacity 500ms ease-out,
      display 600ms allow-discrete;
  }

  dialog[popover]:popover-open::backdrop {
    background-color: #0008;
    opacity: 1;
    transition-behavior: allow-discrete;
  }

  @starting-style {
    dialog[popover]:popover-open::backdrop {
      opacity: 0;
    }
  }
</style>
