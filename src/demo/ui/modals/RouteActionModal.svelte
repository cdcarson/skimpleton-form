<script lang="ts">
  import './modal.css';
  import type { Snippet } from 'svelte';
  import RouteActionModalCloseButton from './RouteActionModalCloseButton.svelte';
  import {
    backdropFade,
    getModalSlide,
    type ModalDisplayOptions,
    type RouteActionModalCloseOptions
  } from './shared.js';
  import { createFocusTrap } from 'focus-trap';
  import {  bodyScrollLock } from '../utils.js';
  import { uniqueId } from '$lib/form/utils.js';

  type Props = {
    header: string | Snippet;
    children: Snippet;
    footer?: Snippet;
  } & RouteActionModalCloseOptions &
    ModalDisplayOptions;

  let {
    closeHref,
    closeDisabled,
    closeModal,
    children,
    header,
    footer,
    animationDuration = 300,
    hideBackdrop = false,
    position = 'centered',
    size = 'medium',
    dismissOnOutsideClick = true
  }: Props = $props();

  const headerId = uniqueId();
  let modalSlide = $derived(getModalSlide(position));
  let contentEl: HTMLElement | undefined = $state();

  const innerCloseModal = () => {
    if (!closeDisabled) {
      closeModal();
    }
  };

  const windowHandleKeydown = async (event: KeyboardEvent) => {
    if ('Escape' === event.key) {
      innerCloseModal();
    }
  };
  const windowHandleMousedown = async (event: MouseEvent | TouchEvent) => {
    if (event.target && contentEl && contentEl.contains(event.target as Node)) {
      return;
    }
    if (dismissOnOutsideClick === false) {
      return;
    }

    if (!closeDisabled) {
      innerCloseModal();
    }
  };

  $effect(() => {
    const focusTrap = createFocusTrap(contentEl as HTMLElement, {
      allowOutsideClick: true,
      fallbackFocus: contentEl
    });
    focusTrap.activate();
    bodyScrollLock.lock();
    window.addEventListener('keydown', windowHandleKeydown);
    window.addEventListener('mousedown', windowHandleMousedown);
    return () => {
      focusTrap.deactivate();
      bodyScrollLock.unlock();
      window.removeEventListener('keydown', windowHandleKeydown);
      window.removeEventListener('mousedown', windowHandleMousedown);
    };
  });
</script>

{#if !hideBackdrop}
  <div
    class="modal-backdrop"
    transition:backdropFade|global={{ duration: animationDuration }}
  ></div>
{/if}
<div
  class="modal-slide"
  transition:modalSlide|global={{ duration: animationDuration }}
>
  <div
    class="modal"
    class:fullscreen={position === 'fullscreen'}
    class:centered={position === 'centered'}
    class:left={position === 'left'}
    class:right={position === 'right'}
    class:top={position === 'top'}
    class:bottom={position === 'bottom'}
    class:tiny={size === 'tiny' && position !== 'fullscreen'}
    class:small={size === 'small' && position !== 'fullscreen'}
    class:medium={size === 'medium' && position !== 'fullscreen'}
    class:large={size === 'large' && position !== 'fullscreen'}
    class:extra-large={size === 'extra-large' && position !== 'fullscreen'}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby={headerId}
    bind:this={contentEl}
  >
    <header class="modal-header">
      <h2 id={headerId}>
        {#if typeof header === 'string'}
          {header}
        {:else}
          {@render header()}
        {/if}
      </h2>
      <RouteActionModalCloseButton {closeModal} {closeHref} {closeDisabled}>
        <span class="sr-only">Close modal dialog</span>
        <span class="icon-[bi--x-lg]"></span>
      </RouteActionModalCloseButton>
    </header>
    <div class="modal-body">
      {@render children()}
    </div>
    {#if footer}
      <footer class="modal-footer">
        {@render footer()}
      </footer>
    {/if}
  </div>
</div>
