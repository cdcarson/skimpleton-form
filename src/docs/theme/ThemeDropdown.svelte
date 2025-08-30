<script lang="ts">
  import { themeService } from './theme-service.svelte.js';
  import { type Theme, THEMES } from './shared.js';

  const handleThemeSelect = (theme: Theme) => {
    themeService.mode = theme;
  };
</script>

<button
  class="btn btn-outline btn-accent"
  popovertarget="popover-1"
  style="anchor-name:--anchor-1"
>
  {@render themeIcon(themeService.mode)}
  <span class="sr-only">Set Theme</span>
</button>
<ul
  role="menu"
  class="menu dropdown dropdown-end w-36 translate-y-2 rounded-box bg-base-100 shadow-lg"
  popover
  id="popover-1"
  style="position-anchor:--anchor-1"
>
  <li role="presentation" class="menu-title dark:text-gray-300">
    <span>Set Theme</span>
  </li>
  {#each THEMES as option (option)}
    <li role="menuitem">
      <button
        type="button"
        class:menu-active={themeService.mode === option}
        onclick={() => handleThemeSelect(option)}
      >
        {@render themeIcon(option)}
        <span>{option}</span>
      </button>
    </li>
  {/each}
</ul>

{#snippet themeIcon(theme: Theme)}
  {#if theme === 'light'}
    <span class="icon-[bi--sun]"></span>
  {:else if theme === 'dark'}
    <span class="icon-[bi--moon]"></span>
  {:else if theme === 'system'}
    <span class="icon-[bi--gear]"></span>
  {/if}
{/snippet}
