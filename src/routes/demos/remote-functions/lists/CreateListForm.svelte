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
  {...enhanceRemoteFunctionForm(createTodoList, form, {
    onSuccess: async () => {
      form.data = {
        name: '',
        description: ''
      };
      modal?.close();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  })}
  class="flex flex-col gap-4"
>
  <PopoverModal bind:this={modal} id={modalId} title="Create List">
    <div class="flex flex-col gap-4">
      <div class="space-y-1">
        <label for={form.controlId('name')} class="block">List Name</label>
        <input
          type="text"
          name={form.controlName('name')}
          id={form.controlId('name')}
          bind:value={form.data.name}
          placeholder="Enter list name"
          class="control"
          class:invalid={form.shownErrors.name}
          oninput={() => form.touch('name')}
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
          class="control"
          class:invalid={form.shownErrors.description}
          oninput={() => form.touch('description')}
          aria-describedby={form.controlId('description') + '-description'}
        ></textarea>
        <div
          class="text-sm"
          id={form.controlId('description') + '-description'}
        >
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
      <pre>{JSON.stringify(form.errors, null, 2)}</pre>
      <pre>{JSON.stringify(form.shownErrors, null, 2)}</pre>
    </div>
    {#snippet footer()}
      <button
        type="button"
        class="button"
        popovertarget={modalId}
        popoverTargetAction="hide"
      >
        <span>Cancel</span>
      </button>

      <button
        type="submit"
        class="button button-primary"
        disabled={form.submitting}
      >
        <span class="icon-[bi--plus-lg]"></span>
        <span>Create</span>
      </button>
    {/snippet}
  </PopoverModal>
</form>
