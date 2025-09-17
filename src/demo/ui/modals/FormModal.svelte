<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../cn.js';

  type Props = {
    id: string;
    title: string;
    body: Snippet<[close: () => void]>;
    position?: 'center' | 'right';
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    class?: string;
  };

  let {
    id,
    title,
    body,
    position = 'center',
    width = 'md',
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
  data-position={position}
  class={cn(
    [
      // Position classes (independent of width)
      position === 'center' && [
        // Base center positioning
        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',

        // Override positioning when fullscreen (based on width variant)
        width === 'sm' && [
          'top-0 left-0 translate-x-0 translate-y-0',
          'sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2'
        ],
        width === 'md' && [
          'top-0 left-0 translate-x-0 translate-y-0',
          'md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2'
        ],
        width === 'lg' && [
          'top-0 left-0 translate-x-0 translate-y-0',
          'lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2'
        ],
        width === 'xl' && [
          'top-0 left-0 translate-x-0 translate-y-0',
          'xl:top-1/2 xl:left-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2'
        ],
        width === '2xl' && [
          'top-0 left-0 translate-x-0 translate-y-0',
          '2xl:top-1/2 2xl:left-1/2 2xl:-translate-x-1/2 2xl:-translate-y-1/2'
        ]
      ],

      position === 'right' && 'top-0 right-0 bottom-0 left-auto',

      // Width classes
      width === 'xs' && 'w-80 max-w-[calc(100vw-2rem)]',
      width === 'sm' && 'w-full sm:w-96',
      width === 'md' && 'w-full md:w-[28rem]',
      width === 'lg' && 'w-full lg:w-[32rem]',
      width === 'xl' && 'w-full xl:w-[36rem]',
      width === '2xl' && 'w-full 2xl:w-[42rem]',

      // Height classes
      position === 'center' && [
        // xs never needs h-full since it's never fullscreen
        width === 'sm' && 'h-full sm:h-fit',
        width === 'md' && 'h-full md:h-fit',
        width === 'lg' && 'h-full lg:h-fit',
        width === 'xl' && 'h-full xl:h-fit',
        width === '2xl' && 'h-full 2xl:h-fit'
      ],
      position === 'right' && 'h-full',

      // Max-height for center position (when not fullscreen)
      position === 'center' && [
        width === 'xs' && 'max-h-[calc(100vh-2rem)]',
        width === 'sm' && 'sm:max-h-[calc(100vh-2rem)]',
        width === 'md' && 'md:max-h-[calc(100vh-2rem)]',
        width === 'lg' && 'lg:max-h-[calc(100vh-2rem)]',
        width === 'xl' && 'xl:max-h-[calc(100vh-2rem)]',
        width === '2xl' && '2xl:max-h-[calc(100vh-2rem)]'
      ],

      // Border and rounding classes (dependent on both width and position)
      position === 'center' && [
        width === 'xs' && 'rounded border',
        width === 'sm' && 'rounded-none border-0 sm:rounded sm:border',
        width === 'md' && 'rounded-none border-0 md:rounded md:border',
        width === 'lg' && 'rounded-none border-0 lg:rounded lg:border',
        width === 'xl' && 'rounded-none border-0 xl:rounded xl:border',
        width === '2xl' && 'rounded-none border-0 2xl:rounded 2xl:border'
      ],

      position === 'right' && [
        width === 'xs' && 'border-l',
        width === 'sm' && 'border-0 sm:border-l',
        width === 'md' && 'border-0 md:border-l',
        width === 'lg' && 'border-0 lg:border-l',
        width === 'xl' && 'border-0 xl:border-l',
        width === '2xl' && 'border-0 2xl:border-l'
      ]
    ],

    // Base colors that always apply
    'border-gray-300 bg-white dark:border-gray-700 dark:bg-black',
    'backdrop:bg-black/50',

    // User-provided classes
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
  <div class="p-4">
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

  dialog[popover][data-position='center'] {
    transform: translateY(50vh);
    transition:
      transform var(--duration) ease-out,
      opacity var(--duration) ease-out,
      display var(--duration) allow-discrete,
      overlay var(--duration) allow-discrete;
  }

  dialog[popover][data-position='right'] {
    transform: translateX(100%);
    transition:
      transform var(--duration) ease-out,
      opacity var(--duration) ease-out,
      display var(--duration) allow-discrete,
      overlay var(--duration) allow-discrete;
  }

  dialog[popover]:popover-open {
    opacity: 1;
    @starting-style {
      opacity: 0;
    }
  }

  dialog[popover][data-position='center']:popover-open {
    transform: translateY(0);
    @starting-style {
      transform: translateY(50vh);
      opacity: 0;
    }
  }

  dialog[popover][data-position='right']:popover-open {
    transform: translateX(0);
    @starting-style {
      transform: translateX(100%);
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
