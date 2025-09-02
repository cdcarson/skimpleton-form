<script lang="ts">
    import CreateListForm from './CreateListForm.svelte';
  import { uniqueId } from '$lib/form/utils.js';
  let { data } = $props();
  const createModalId = uniqueId('create-modal-');
</script>

<div class="px-4">
  <h1 class="mb-6 text-2xl font-bold">Your Todo Lists</h1>
  <button popovertarget={createModalId} class="btn">Create List</button>

  {#if data.todoLists.length === 0}
    <div class="rounded-lg bg-base-200 p-8 text-center">
      <p class="mb-4 text-lg">You don't have any todo lists yet.</p>
      <p class="text-sm text-base-content/70">
        Create your first list to get started!
      </p>
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.todoLists as list (list.id)}
        <div
          class="card bg-base-100 shadow-md transition-shadow hover:shadow-lg"
        >
          <div class="card-body">
            <h2 class="card-title">{list.name}</h2>
            {#if list.description}
              <p class="text-base-content/70">{list.description}</p>
            {/if}
            <div class="mt-2 text-sm text-base-content/50">
              Created: {new Date(list.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<CreateListForm modalId={createModalId} />
