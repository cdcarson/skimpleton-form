<script lang="ts">
  import { signOut } from './data.remote.js';
  import {
    ClientFormState,
    enhanceRemoteFunctionForm
  } from '$lib/form/client.svelte.js';
  import z from 'zod';

  type Props = {
    formId: string;
  };
  let { formId }: Props = $props();

  const form = new ClientFormState(z.object({}), {});
</script>

<form id={formId} {...enhanceRemoteFunctionForm(signOut, form)}></form>
