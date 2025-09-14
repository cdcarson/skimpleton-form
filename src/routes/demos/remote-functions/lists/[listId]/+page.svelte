<script lang="ts">
  import AddItemForm from './AddItemForm.svelte';
  import TodoItemCard from './TodoItemCard.svelte';
  import AppMessage from '$lib/message/AppMessage.svelte';
  import {
    ClientFormState,
    enhanceRemoteFunctionForm
  } from '$lib/form/client.svelte.js';
  import { updateTodoList } from './data.remote.js';
  import { updateTodoListSchema } from './schemas.js';

  let { data } = $props();

  const completedItems = $derived(
    data.list.items.filter((item) => item.completed)
  );
  const incompleteItems = $derived(
    data.list.items.filter((item) => !item.completed)
  );

  let editingList = $state(false);

  const editListForm = new ClientFormState(
    updateTodoListSchema,
    {
      listId: data.list.id,
      name: data.list.name,
      description: data.list.description || ''
    },
    updateTodoList.result
  );

  const startEditList = () => {
    editingList = true;
    editListForm.data.name = data.list.name;
    editListForm.data.description = data.list.description || '';
  };

  const cancelEditList = () => {
    editingList = false;
    editListForm.data.name = data.list.name;
    editListForm.data.description = data.list.description || '';
    editListForm.untouchAll();
  };

  $effect(() => {
    if (updateTodoList.result?.success) {
      editingList = false;
    }
  });
</script>

<div class="px-4">
  <div class="mb-6">
    <a
      href="/demos/remote-functions/lists"
      class="button button-sm mb-4 inline-flex items-center"
    >
      <span class="icon-[bi--arrow-left]"></span>
      Back to Lists
    </a>

    {#if editingList}
      <form
        {...enhanceRemoteFunctionForm(updateTodoList, editListForm)}
        class="space-y-3"
      >
        <input type="hidden" name="listId" value={data.list.id} />

        <div>
          <label for={editListForm.controlId('name')} class="sr-only"
            >List name</label
          >
          <input
            id={editListForm.controlId('name')}
            name={editListForm.controlName('name')}
            type="text"
            bind:value={editListForm.data.name}
            onblur={() => editListForm.touch('name')}
            class="control w-full text-2xl font-bold"
            required
          />
          {#if editListForm.shownErrors?.name}
            <div class="mt-1 text-sm text-red-600">
              {editListForm.shownErrors.name}
            </div>
          {/if}
        </div>

        <div>
          <label for={editListForm.controlId('description')} class="sr-only"
            >Description</label
          >
          <textarea
            id={editListForm.controlId('description')}
            name={editListForm.controlName('description')}
            bind:value={editListForm.data.description}
            onblur={() => editListForm.touch('description')}
            placeholder="Description (optional)"
            class="control w-full"
            rows="2"
          ></textarea>
          {#if editListForm.shownErrors?.description}
            <div class="mt-1 text-sm text-red-600">
              {editListForm.shownErrors.description}
            </div>
          {/if}
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            disabled={editListForm.submitting}
            class="button button-primary"
          >
            {editListForm.submitting ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onclick={cancelEditList} class="button">
            Cancel
          </button>
        </div>
      </form>
    {:else}
      <div class="group flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold">{data.list.name}</h1>
          {#if data.list.description}
            <p class="mt-1 text-gray-600 dark:text-gray-400">
              {data.list.description}
            </p>
          {/if}
        </div>
        <button
          type="button"
          onclick={startEditList}
          class="button button-xs opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Edit list"
        >
          <span class="icon-[bi--pencil]"></span>
          Edit
        </button>
      </div>
    {/if}
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
