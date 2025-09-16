<script lang="ts">
  import {
    ClientFormState,
    type ServerFormState,
    enhanceActionForm
  } from '$lib/index.js';
  import type { PageData } from './$types.js';
  import { nameSchema } from './shared.js';
  import FormModal from '$demo/ui/modals/FormModal.svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';

  type Props = {
    modalId: string;
    data: PageData;
    actionData: ServerFormState<typeof nameSchema>;
  };
  let { modalId, data, actionData }: Props = $props();

  const form = new ClientFormState(
    nameSchema,
    { name: data.value },
    actionData
  );
  let position: 'center' | 'right' = $state('center');
</script>



<FormModal id={modalId} title="Edit Name" position="right">
  {#snippet body(close)}
    <form
      method="POST"
      use:enhance={enhanceActionForm(form, {
        onSuccess: async () => {
          await invalidateAll();
          close();
        }
      })}
    >
      <div class="space-y-4">
        <div class="space-y-1">
          <label for={form.controlId('name')} class="block">Name</label>
          <input
            type="text"
            name={form.controlName('name')}
            id={form.controlId('name')}
            bind:value={form.data.name}
            class="control"
            class:invalid={form.shownErrors.name}
            aria-describedby={form.controlId('name') + '-description'}
          />
          <div class="text-sm" id={form.controlId('name') + '-description'}>
            {#if form.shownErrors.name}
              <span class="text-red-700 dark:text-red-300">
                {form.shownErrors.name}
              </span>
            {/if}
          </div>
        </div>
        <div class="flex justify-between">
          <button
            type="button"
            class="button"
            popovertarget={modalId}
            popoverTargetAction="hide">Cancel</button
          >
          <button type="submit" class="button button-primary">Save</button>
        </div>
      </div>
    </form>
  {/snippet}
</FormModal>
