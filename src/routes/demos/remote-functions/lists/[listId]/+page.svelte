<script lang="ts">
  import AddItemForm from './AddItemForm.svelte';
  import TodoItemCard from './TodoItemCard.svelte';
  import AppMessage from '$lib/message/AppMessage.svelte';

  let { data } = $props();

  const completedItems = $derived(
    data.list.items.filter((item) => item.completed)
  );
  const incompleteItems = $derived(
    data.list.items.filter((item) => !item.completed)
  );
</script>

<div class="px-4">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <a
        href="/demos/remote-functions/lists"
        class="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <span class="mr-1 icon-[bi--arrow-left]"></span>
        Back to Lists
      </a>
      <h1 class="text-2xl font-bold">{data.list.name}</h1>
      {#if data.list.description}
        <p class="mt-1 text-gray-600 dark:text-gray-400">
          {data.list.description}
        </p>
      {/if}
    </div>
  </div>

  <AppMessage />

  <AddItemForm listId={data.list.id} />

  {#if data.list.items.length === 0}
    <div class="rounded-lg bg-gray-100 p-8 text-center dark:bg-gray-800">
      <p class="mb-2 text-lg">No items yet</p>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Add your first item to get started!
      </p>
    </div>
  {:else}
    <div class="space-y-6">
      {#if incompleteItems.length > 0}
        <div>
          <h2 class="mb-3 text-lg font-semibold">To Do</h2>
          <div class="space-y-2">
            {#each incompleteItems as item (item.id)}
              <TodoItemCard {item} />
            {/each}
          </div>
        </div>
      {/if}

      {#if completedItems.length > 0}
        <div>
          <h2 class="mb-3 text-lg font-semibold text-gray-500">Completed</h2>
          <div class="space-y-2">
            {#each completedItems as item (item.id)}
              <TodoItemCard {item} />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
