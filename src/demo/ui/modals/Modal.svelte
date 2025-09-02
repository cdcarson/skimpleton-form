<script lang="ts">
  import './modal.css';
  import type { Snippet } from 'svelte';
  import {
    backdropFade,
    getModalSlide,
    type ModalPosition,
    type ModalSize
  } from './shared.js';
  import { bodyScrollLock } from '../utils.js';
  import { goto } from '$app/navigation';
  import { uniqueId } from '$lib/form/utils.js';
  import { createFocusTrap, type FocusTrap } from 'focus-trap';

  type Props = {
    checkboxId: string;
    open: boolean;
    children: Snippet;
    header: string | Snippet;
    footer?: Snippet;
    position?: ModalPosition;
    closeDisabled?: boolean;
    size?: ModalSize;
    backdropVisible?: boolean;
    animationDuration?: number;
    dismissOnOutsideClick?: boolean;
    onClose?: string | (() => Promise<void>);
    initialFocusId?: string;
  };
  let {
    open = $bindable(),
    children,
    header,
    footer,
    position = 'centered',
    closeDisabled,
    size = 'medium',
    backdropVisible = true,
    animationDuration = 500,
    onClose,
    dismissOnOutsideClick,
    initialFocusId
  }: Props = $props();

  const headerId = uniqueId();
  const modalSlide = getModalSlide(position);
  let contentEl: HTMLElement | undefined = $state();
  const closeModal = async () => {
    if (!closeDisabled) {
      if (onClose) {
        if (typeof onClose === 'string') {
          await goto(onClose, { noScroll: true });
        } else {
          await onClose();
        }
      }
      open = false;
    }
  };
  const windowHandleKeydown = async (event: KeyboardEvent) => {
    if ('Escape' === event.key && !closeDisabled) {
      await closeModal();
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
      await closeModal();
    }
  };
  let focusTrap: FocusTrap | undefined = $state();

  $effect(() => {
    if (open) {
      if (!focusTrap) {
        focusTrap = createFocusTrap(contentEl as HTMLElement, {
          allowOutsideClick: true,
          fallbackFocus: contentEl
        });
      }
      if (initialFocusId) {
        setTimeout(() => {
          const initialFocus = document.getElementById(initialFocusId);
          if (initialFocus) {
            initialFocus.focus();
          }
        }, 100);
      }
      focusTrap.activate();
      bodyScrollLock.lock();
      window.addEventListener('keydown', windowHandleKeydown);
      window.addEventListener('mousedown', windowHandleMousedown);
    } else {
      if (focusTrap) {
        focusTrap.deactivate();
      }
      bodyScrollLock.unlock();
      window.removeEventListener('keydown', windowHandleKeydown);
      window.removeEventListener('mousedown', windowHandleMousedown);
    }

    return () => {
      if (focusTrap) {
        focusTrap.deactivate();
      }
      bodyScrollLock.unlock();
      window.removeEventListener('keydown', windowHandleKeydown);
      window.removeEventListener('mousedown', windowHandleMousedown);
    };
  });
</script>


{#if open}
  {#if backdropVisible}
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
        {#if typeof onClose === 'string'}
          <a
            href={onClose}
            class="btn"
            data-sveltekit-noscroll
            class:disabled={closeDisabled}
            onclick={(event) => {
              if (closeDisabled) {
                event.preventDefault();
              }
            }}
            aria-label="Close"
          >
            <span class="icon-[bi--x-lg]"></span>
          </a>
        {:else}
          <button
            class="btn"
            type="button"
            disabled={closeDisabled}
            onclick={closeModal}
            aria-label="Close"
          >
            <span class="icon-[bi--x-lg]"></span>
          </button>
        {/if}
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
{/if}
