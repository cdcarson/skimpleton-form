<script lang="ts">
  import CreateListForm from './CreateListForm.svelte';
  import { uniqueId } from '$lib/form/utils.js';
  let { data } = $props();
  const createModalId = uniqueId('create-modal');
</script>

<div class="px-4">
  <h1 class="mb-6 text-2xl font-bold">Your Todo Lists</h1>
  <button popovertarget={createModalId} class="button">Create List</button>

  {#if data.todoLists.length === 0}
    <div class="rounded-lg bg-gray-100 p-8 text-center dark:bg-gray-800">
      <p class="mb-4 text-lg">You don't have any todo lists yet.</p>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Create your first list to get started!
      </p>
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.todoLists as list (list.id)}
        <a
          href="/demos/remote-functions/lists/{list.id}"
          class="block rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <div>
            <h2 class="mb-2 text-lg font-semibold">{list.name}</h2>
            {#if list.description}
              <p class="text-gray-600 dark:text-gray-400">{list.description}</p>
            {/if}
            <div class="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Created: {new Date(list.createdAt).toLocaleDateString()}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<CreateListForm modalId={createModalId} />
