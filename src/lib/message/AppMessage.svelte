<script lang="ts">
  import { AppMessageService } from './app-message.svelte.js';
  import type { ApplicationMessageData } from './app-message.shared.js';

  type ViewportPosition =
    | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

  type Props = {
    viewportPosition?: ViewportPosition;
    viewportMargin?: string;
    flashMessage?: ApplicationMessageData;
  };

  let {
    viewportPosition = 'bottom',
    viewportMargin = '1rem',
    flashMessage
  }: Props = $props();

  const messageService = AppMessageService.get();

  let flashMessageShown = $state(false);

  $effect(() => {
    if (flashMessage && !flashMessageShown) {
      messageService.setMessage(flashMessage);
      flashMessageShown = true;
    }
  });

  let style = $derived.by(() => {
    let top = 'auto';
    let bottom = 'auto';
    let left = 'auto';
    let right = 'auto';
    let translateX = '0';
    let translateY = '0';
    let padding = '0';
    let width = `min(20rem, 100vw)`;

    if (viewportPosition === 'top') {
      top = '0';
      left = '50%';
      translateX = '-50%';
      translateY = '0';
      padding = `${viewportMargin} 0 0 0`;
    } else if (viewportPosition === 'bottom') {
      bottom = '0';
      left = '50%';
      translateX = '-50%';
      translateY = '0';
      padding = `0 0 ${viewportMargin} 0`;
    } else if (viewportPosition === 'top-left') {
      top = '0';
      left = '0';
      translateX = '0';
      translateY = '0';
      padding = `${viewportMargin} 0 0 ${viewportMargin}`;
    } else if (viewportPosition === 'top-right') {
      top = '0';
      right = '0';
      translateX = '0';
      translateY = '0';
      padding = `${viewportMargin} ${viewportMargin} 0 0`;
    } else if (viewportPosition === 'bottom-left') {
      bottom = '0';
      left = '0';
      translateX = '0';
      translateY = '0';
      padding = `0 0 ${viewportMargin} ${viewportMargin}`;
    } else if (viewportPosition === 'bottom-right') {
      bottom = '0';
      right = '0';
      translateX = '0';
      translateY = '0';
      padding = `0 ${viewportMargin} ${viewportMargin} 0`;
    }

    return `--top: ${top}; --bottom: ${bottom}; --left: ${left}; --right: ${right}; --width: ${width}; --translate-x: ${translateX}; --translate-y: ${translateY}; --padding: ${padding};`;
  });

  // Add IDs to messages for keyed each block
  let messagesWithIds = $derived(
    messageService.mostRecent.map((message) => ({
      ...message,
      _id: `app-message-${Math.random().toString(36).substring(2, 8)}`
    }))
  );

  let currentMessage = $derived(messageService.current);

  const getAriaLabel = (message: ApplicationMessageData): string => {
    switch (message.type) {
      case 'success':
        return `Success: ${message.message}`;
      case 'error':
        return `Error: ${message.message}`;
      case 'wait':
        return `Status: ${message.message}`;
      default:
        return message.message;
    }
  };

  const dismissMessage = () => {
    messageService.clear();
  };

  const slide = (_node: HTMLElement, opts?: { duration: number }) => {
    const mergedOpts = { duration: 250, ...opts };
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const calculatedDuration =
      mediaQuery && mediaQuery.matches ? 0 : mergedOpts.duration;
    const isTop = viewportPosition.startsWith('top');

    return {
      delay: 0,
      duration: calculatedDuration,
      css: (t: number) => {
        const translateY = isTop ? `${t * 100 - 100}%` : `${100 - t * 100}%`;
        return `transform: translate(var(--translate-x), ${translateY})`;
      }
    };
  };
</script>

<!-- Current message display -->
{#if currentMessage}
  <div
    class="message"
    {style}
    class:wait={currentMessage.type === 'wait'}
    class:success={currentMessage.type === 'success'}
    class:error={currentMessage.type === 'error'}
    role="status"
    aria-live="polite"
    aria-label={getAriaLabel(currentMessage)}
    in:slide
    out:slide
  >
    <div class="content">
      <div class="icon"></div>
      <div class="text">
        {currentMessage.message}
      </div>
      {#if currentMessage.type === 'success' || currentMessage.type === 'error'}
        <button
          class="dismiss"
          onclick={dismissMessage}
          aria-label="Dismiss message"
          type="button"
        >
          <span></span>
        </button>
      {/if}
    </div>
  </div>
{/if}

<!-- Visually hidden recent messages list for accessibility -->
<div
  class="sr-only"
  aria-live="polite"
  aria-label="Recent application messages"
  role="log"
>
  {#each messagesWithIds as message (message._id)}
    <div aria-label={getAriaLabel(message)}>
      {message.message}
    </div>
  {/each}
</div>

<style>
  .message {
    box-sizing: border-box;
    position: fixed;
    top: var(--top);
    bottom: var(--bottom);
    left: var(--left);
    right: var(--right);
    width: var(--width);
    padding: var(--padding);
    transform: translate(var(--translate-x), var(--translate-y));
    z-index: 30000;
  }

  .message > .content {
    display: flex;
    padding: var(--skimpleton-application-message-padding, 0.5rem);
    border-radius: var(--skimpleton-application-message-border-radius, 0.25rem);
    align-items: center;
    gap: var(--skimpleton-application-message-gap, 0.5rem);
    background-color: black;
    color: white;
    font-size: var(--skimpleton-application-message-font-size, 1rem);
    line-height: var(--skimpleton-application-message-line-height, 1.5);
  }

  .message.wait > .content {
    /* Default: tailwind gray-100 background, gray-900 text */
    background-color: var(
      --skimpleton-application-message-wait-background,
      oklch(0.961151 0.013617 106.47269)
    );
    color: var(
      --skimpleton-application-message-wait-color,
      oklch(0.197676 0.006569 83.915558)
    );
  }

  .message.success > .content {
    /* Default: tailwind green-700 background, white text */
    background-color: var(
      --skimpleton-application-message-success-background,
      oklch(0.548371 0.16768 142.495148)
    );
    color: var(--skimpleton-application-message-success-color, oklch(1 0 0));
  }

  .message.error > .content {
    /* Default: tailwind red-700 background, white text */
    background-color: var(
      --skimpleton-application-message-error-background,
      oklch(0.558131 0.183364 22.763306)
    );
    color: var(--skimpleton-application-message-error-color, oklch(1 0 0));
  }

  .icon {
    width: 1rem;
    height: 1rem;
    background-color: currentColor;
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    flex-shrink: 0;
  }

  .message.success > .content > .icon {
    /* Default: Bootstrap Icons check-circle-fill */
    mask-image: var(
      --skimpleton-application-message-success-icon,
      url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16'/%3e%3cpath d='m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05'/%3e%3c/svg%3e")
    );
  }

  .message.error > .content > .icon {
    /* Default: Bootstrap Icons exclamation-circle-fill */
    mask-image: var(
      --skimpleton-application-message-error-icon,
      url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16'/%3e%3cpath d='M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z'/%3e%3c/svg%3e")
    );
  }

  .message.wait > .content > .icon {
    /* Default: Bootstrap Icons hourglass */
    mask-image: var(
      --skimpleton-application-message-wait-icon,
      url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath d='M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1-.5-.5m2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256 1.011.791 1.011 1.491v.702c0 .7-.478 1.235-1.011 1.491A3.5 3.5 0 0 0 4.5 13v1h7v-1a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351v-.702c0-.7.478-1.235 1.011-1.491A3.5 3.5 0 0 0 11.5 3V2z'/%3e%3c/svg%3e")
    );
    animation: hourglass-flip 3s ease-in-out infinite;
  }

  .text {
    flex: 1;
    font-size: var(--skimpleton-application-message-text-font-size, 0.875rem);
    line-height: var(
      --skimpleton-application-message-text-line-height,
      1.25rem
    );
    font-weight: var(--skimpleton-application-message-text-font-weight, 500);
  }

  button.dismiss {
    background: none;
    border: none;
    cursor: pointer;
    color: currentColor;
    opacity: 0.7;
    padding: 0;
    line-height: 1;
    border-radius: 0.25rem;
    transition: opacity 0.2s;
    flex-shrink: 0;
    margin-left: auto;
    width: 1rem;
    height: 1rem;
  }

  button.dismiss:hover {
    opacity: 1;
  }

  button.dismiss:focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  button.dismiss > span {
    display: block;
    width: 1rem;
    height: 1rem;
    background-color: currentColor;
    /* Default: Bootstrap Icons x */
    mask-image: var(
      --skimpleton-application-message-dismiss-icon,
      url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath d='M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z'/%3e%3c/svg%3e")
    );
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes hourglass-flip {
    0%,
    50% {
      transform: rotate(0deg);
    }
    75%,
    100% {
      transform: rotate(180deg);
    }
  }
</style>
