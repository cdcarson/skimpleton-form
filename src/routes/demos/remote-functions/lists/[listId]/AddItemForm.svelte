<script lang="ts">
  import {
    ClientFormState,
    enhanceRemoteFunctionForm
  } from '$lib/form/client.svelte.js';
  import { createTodoItem } from './data.remote.js';
  import { createTodoItemSchema } from './schemas.js';

  type Props = {
    listId: string;
  };

  let { listId }: Props = $props();

  const form = new ClientFormState(
    createTodoItemSchema,
    {
      listId,
      name: '',
      description: ''
    },
    createTodoItem.result
  );
</script>

<form
  {...enhanceRemoteFunctionForm(createTodoItem, form, {
    onSuccess: () => {
      form.data = {
        listId,
        name: '',
        description: ''
      };
      form.untouchAll();
      form.errors = {};
    }
  })}
  class="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
>
  <input type="hidden" name="listId" value={listId} />

  <div class="flex items-start gap-2">
    <div class="flex-1">
      <input
        id={form.controlId('name')}
        name={form.controlName('name')}
        type="text"
        bind:value={form.data.name}
        onblur={() => form.touch('name')}
        placeholder="Add a new item..."
        class="control w-full"
        required
        aria-label="New item name"
      />
      {#if form.shownErrors?.name}
        <div class="mt-1 text-sm text-red-600">{form.shownErrors.name}</div>
      {/if}
    </div>

    <button
      type="submit"
      disabled={form.submitting}
      class="button button-primary"
    >
      {form.submitting ? 'Adding...' : 'Add'}
    </button>
  </div>

  <div class="mt-2">
    <label for={form.controlId('description')} class="sr-only"
      >Description (optional)</label
    >
    <textarea
      id={form.controlId('description')}
      name={form.controlName('description')}
      bind:value={form.data.description}
      onblur={() => form.touch('description')}
      placeholder="Description (optional)"
      class="control w-full"
      rows="2"
    ></textarea>
    {#if form.shownErrors?.description}
      <div class="mt-1 text-sm text-red-600">
        {form.shownErrors.description}
      </div>
    {/if}
  </div>
</form>
