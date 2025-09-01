<script lang="ts">
  import { ClientFormState } from '$lib/form/client-form-state.svelte.js';
  import { kitchenSinkSchema } from './schemas.js';
  const form = new ClientFormState(
    kitchenSinkSchema,
    {
      name: '',
      age: 18,
      email: ''
    },
    {
      data: {
        name: '',
        age: 18,
        email: 'foo@bar.com'
      },
      touched: {},
      valid: false,
      submitted: true,
      errors: {
        email: 'We could not find it.'
      }
    }
  );
</script>

<div class="space-y-4">
  <form class="block space-y-4">
    <div class="space-y-1">
      <label class="label block" for={form.controlId('name')}>Name</label>
      <input
        id={form.controlId('name')}
        class="input"
        type="text"
        name={form.controlName('name')}
        bind:value={form.data.name}
        oninput={() => form.touch('name')}
        class:input-error={form.shownErrors.name}
        aria-invalid={form.shownErrors.name ? 'true' : undefined}
        aria-describedby={form.controlId('name') + '-description'}
      />
      <div class="text-xs" id={form.controlId('name') + '-description'}>
        {#if form.shownErrors.name}
          <span class="text-red-500">{form.shownErrors.name}</span>
        {:else}
          <span class="text-gray-600">This is a description</span>
        {/if}
      </div>
    </div>
    <div class="space-y-1">
      <label class="label block" for={form.controlId('age')}>Age</label>
      <input
        class="input"
        type="number"
        name={form.controlName('age')}
        bind:value={form.data.age}
        oninput={() => form.touch('age')}
        class:input-error={form.shownErrors.age}
        aria-invalid={form.shownErrors.age ? 'true' : undefined}
        aria-describedby={form.controlId('age') + '-description'}
      />
      <div class="text-xs" id={form.controlId('age') + '-description'}>
        {#if form.shownErrors.age}
          <span class="text-red-500">{form.shownErrors.age}</span>
        {:else}
          <span class="text-gray-600">This is a description</span>
        {/if}
      </div>
    </div>
    <div class="space-y-1">
      <label class="label block" for={form.controlId('email')}>Email</label>
      <input
        class="input"
        type="email"
        bind:value={form.data.email}
        name={form.controlName('email')}
        oninput={() => form.touch('email')}
        class:input-error={form.shownErrors.email}
        aria-invalid={form.shownErrors.email ? 'true' : undefined}
        aria-describedby={form.controlId('email') + '-description'}
      />
      <div class="text-xs" id={form.controlId('email') + '-description'}>
        {#if form.shownErrors.email}
          <span class="text-red-500">{form.shownErrors.email}</span>
        {:else}
          <span class="text-gray-600">This is a description</span>
        {/if}
      </div>
    </div>
  </form>

  <section class="block">
    <h2 class="text-lg font-bold">Errors</h2>
    <pre>{JSON.stringify(form.errors, null, 2)}</pre>
  </section>
  <section class="block">
    <h2 class="text-lg font-bold">Shown Errors</h2>
    <pre>{JSON.stringify(form.shownErrors, null, 2)}</pre>
  </section>
  <section class="block">
    <h2 class="text-lg font-bold">Data</h2>
    <pre>{JSON.stringify(form.data, null, 2)}</pre>
  </section>
</div>
