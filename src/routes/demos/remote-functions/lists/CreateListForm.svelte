<script lang="ts">
  import {
    ClientFormState,
    enhanceRemoteFunctionForm
  } from '$lib/form/client.svelte.js';
  import { createTodoList } from './data.remote.js';
  import { createTodoListSchema } from './schemas.js';
  import PopoverModal from '$demo/ui/modals/PopoverModal.svelte';
  type Props = {
    modalId: string;
  };
  let { modalId }: Props = $props();
  let modal: PopoverModal | undefined = $state();

  const form = new ClientFormState(
    createTodoListSchema,
    {
      name: '',
      description: ''
    },
    createTodoList.result
  );
</script>

<form
  {...enhanceRemoteFunctionForm(createTodoList, form)}
  class="flex flex-col gap-4"
>
  <PopoverModal bind:this={modal} id={modalId} title="Create List">
    <div class="space-y-1">
      <label for={form.controlId('name')} class="block">List Name</label>
      <input
        type="text"
        name={form.controlName('name')}
        id={form.controlId('name')}
        bind:value={form.data.name}
        placeholder="Enter list name"
        class="input"
        class:input-error={form.shownErrors.name}
        aria-describedby={form.controlId('name') + '-description'}
      />
      <div class="text-sm" id={form.controlId('name') + '-description'}>
        {#if form.shownErrors.name}
          <span class="text-red-700 dark:text-red-300">
            {form.shownErrors.name}
          </span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300">
            Give your todo list a name.
          </span>
        {/if}
      </div>
    </div>

    <div class="space-y-1">
      <label for={form.controlId('description')} class="block">
        Description
      </label>
      <textarea
        name={form.controlName('description')}
        id={form.controlId('description')}
        bind:value={form.data.description}
        placeholder="Add a description for your list"
        rows="3"
        class="textarea"
        class:textarea-error={form.shownErrors.description}
        aria-describedby={form.controlId('description') + '-description'}
      ></textarea>
      <div class="text-sm" id={form.controlId('description') + '-description'}>
        {#if form.shownErrors.description}
          <span class="text-red-700 dark:text-red-300">
            {form.shownErrors.description}
          </span>
        {:else}
          <span class="text-gray-700 dark:text-gray-300">
            Optional description.
          </span>
        {/if}
      </div>
    </div>

    <div class="flex justify-end">
      <button type="submit" class="btn btn-primary" disabled={form.submitting}>
        Create List
      </button>
    </div>
  </PopoverModal>
</form>
