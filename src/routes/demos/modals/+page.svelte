<script lang="ts">
  import { uniqueId } from '$lib/index.js';
  import NameForm from './NameForm.svelte';
  const testModalId = uniqueId('test-modal');

  let { data, form } = $props();
  let actionData: any = $derived(form);
</script>

<div class="container mx-auto p-8">
  <h1 class="mb-8 text-3xl font-bold">Modal Component Demo</h1>

  <div class="flex justify-between gap-8">
    <div>
      Name: {data.value}
    </div>
    <div>
      <button popovertarget={testModalId} class="button button-primary">
        <span class="icon-[bi--person-plus]"></span>
        <span>Edit Name</span>
      </button>
    </div>
  </div>

  <NameForm modalId={testModalId} {data} {actionData} />
</div>
