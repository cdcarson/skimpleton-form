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

  // Reset form after successful submission
  $effect(() => {
    if (createTodoItem.result?.success) {
      form.data = {
        listId,
        name: '',
        description: ''
      };
      form.untouchAll();
    }
  });
</script>

<form
  {...enhanceRemoteFunctionForm(createTodoItem, form)}
  class="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
>
  <input type="hidden" name="listId" value={listId} />

  <div class="flex gap-2">
    <div class="flex-1">
      <label for={form.controlId('name')} class="sr-only">New item name</label>
      <input
        id={form.controlId('name')}
        name={form.controlName('name')}
        type="text"
        bind:value={form.data.name}
        onblur={() => form.touch('name')}
        placeholder="Add a new item..."
        class="input w-full"
        required
      />
      {#if form.shownErrors?.name}
        <div class="mt-1 text-sm text-red-600">{form.shownErrors.name}</div>
      {/if}
    </div>

    <button type="submit" disabled={form.submitting} class="button">
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
      class="input w-full"
      rows="2"
    ></textarea>
    {#if form.shownErrors?.description}
      <div class="mt-1 text-sm text-red-600">
        {form.shownErrors.description}
      </div>
    {/if}
  </div>
</form>
