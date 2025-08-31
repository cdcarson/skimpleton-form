<script lang="ts">
  type Breadcrumb = {
    label: string;
    href?: string;
  };

  type Props = {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
  };

  let { title, description, breadcrumbs = [] }: Props = $props();
</script>

<header class="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
  {#if breadcrumbs.length > 0}
    <nav aria-label="Breadcrumb" class="mb-4">
      <ol
        class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
      >
        {#each breadcrumbs as crumb, i (crumb)}
          <li class="flex items-center">
            {#if crumb.href}
              <a
                href={crumb.href}
                class="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
              >
                {crumb.label}
              </a>
            {:else}
              <span class="font-medium text-gray-900 dark:text-gray-100"
                >{crumb.label}</span
              >
            {/if}
            {#if i < breadcrumbs.length - 1}
              <svg
                class="mx-2 h-4 w-4 text-gray-400 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            {/if}
          </li>
        {/each}
      </ol>
    </nav>
  {/if}

  <h1
    class="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
  >
    {title}
  </h1>

  {#if description}
    <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
      {description}
    </p>
  {/if}
</header>
