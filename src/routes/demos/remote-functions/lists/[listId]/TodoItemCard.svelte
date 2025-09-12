<script lang="ts">
  import {
    ClientFormState,
    enhanceRemoteFunctionForm
  } from '$lib/form/client.svelte.js';
  import {
    toggleTodoItem,
    updateTodoItem,
    deleteTodoItem
  } from './data.remote.js';
  import {
    toggleTodoItemSchema,
    updateTodoItemSchema,
    deleteTodoItemSchema
  } from './schemas.js';

  type TodoItem = {
    id: string;
    todoListId: string;
    name: string;
    description: string | null;
    completed: boolean;
  };

  type Props = {
    item: TodoItem;
  };

  let { item }: Props = $props();

  let editing = $state(false);

  const toggleForm = new ClientFormState(
    toggleTodoItemSchema,
    {
      itemId: item.id,
      listId: item.todoListId,
      completed: (!item.completed).toString() as 'true' | 'false'
    },
    toggleTodoItem.result
  );

  const editForm = new ClientFormState(
    updateTodoItemSchema,
    {
      itemId: item.id,
      listId: item.todoListId,
      name: item.name,
      description: item.description || ''
    },
    updateTodoItem.result
  );

  const deleteForm = new ClientFormState(
    deleteTodoItemSchema,
    {
      itemId: item.id,
      listId: item.todoListId
    },
    deleteTodoItem.result
  );

  const startEdit = () => {
    editing = true;
    editForm.data.name = item.name;
    editForm.data.description = item.description || '';
  };

  const cancelEdit = () => {
    editing = false;
    editForm.data.name = item.name;
    editForm.data.description = item.description || '';
    editForm.untouchAll();
  };

  $effect(() => {
    if (updateTodoItem.result?.success) {
      editing = false;
    }
  });

  // Update form data when item prop changes
  $effect(() => {
    toggleForm.data.completed = (!item.completed).toString() as
      | 'true'
      | 'false';
  });
</script>

<div
  class="group relative rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
>
  {#if editing}
    <form {...enhanceRemoteFunctionForm(updateTodoItem, editForm)}>
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="listId" value={item.todoListId} />

      <div class="space-y-2">
        <input
          type="text"
          name={editForm.controlName('name')}
          bind:value={editForm.data.name}
          onblur={() => editForm.touch('name')}
          class="input w-full"
          required
        />
        {#if editForm.shownErrors?.name}
          <div class="text-sm text-red-600">{editForm.shownErrors.name}</div>
        {/if}

        <textarea
          name={editForm.controlName('description')}
          bind:value={editForm.data.description}
          onblur={() => editForm.touch('description')}
          class="input w-full"
          rows="2"
          placeholder="Description (optional)"
        ></textarea>
        {#if editForm.shownErrors?.description}
          <div class="text-sm text-red-600">
            {editForm.shownErrors.description}
          </div>
        {/if}

        <div class="flex gap-2">
          <button
            type="submit"
            disabled={editForm.submitting}
            class="button button-sm"
          >
            {editForm.submitting ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onclick={cancelEdit}
            class="button button-sm button-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  {:else}
    <div class="flex items-start gap-3">
      <form {...enhanceRemoteFunctionForm(toggleTodoItem, toggleForm)}>
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="listId" value={item.todoListId} />
        <input
          type="hidden"
          name="completed"
          value={(!item.completed).toString()}
        />

        <button
          type="submit"
          disabled={toggleForm.submitting}
          class="mt-1 flex h-5 w-5 items-center justify-center rounded border-2 {item.completed
            ? 'border-green-500 bg-green-500'
            : 'border-gray-300 hover:border-gray-400'}"
          aria-label={item.completed
            ? 'Mark as incomplete'
            : 'Mark as complete'}
        >
          {#if item.completed}
            <span class="icon-[bi--check] text-white"></span>
          {/if}
        </button>
      </form>

      <div class="flex-1">
        <h3
          class="font-medium {item.completed
            ? 'text-gray-500 line-through'
            : ''}"
        >
          {item.name}
        </h3>
        {#if item.description}
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {item.description}
          </p>
        {/if}
      </div>

      <div
        class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <button
          type="button"
          onclick={startEdit}
          class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          aria-label="Edit item"
        >
          <span class="icon-[bi--pencil]"></span>
        </button>

        <form {...enhanceRemoteFunctionForm(deleteTodoItem, deleteForm)}>
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="listId" value={item.todoListId} />

          <button
            type="submit"
            disabled={deleteForm.submitting}
            class="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
            aria-label="Delete item"
          >
            <span class="icon-[bi--trash]"></span>
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>
