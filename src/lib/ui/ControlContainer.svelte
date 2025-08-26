<script lang="ts" generics="S extends ZFormObject">
  // import type { Snippet } from 'svelte';
  import { formPath } from '$lib/form/paths.js';
  import type { ZFormObject } from '$lib/form/types.js';
  import type { ZFormPaths } from '$lib/form/paths.types.js';

  type Props = {
    schema: S;
    path: ZFormPaths<S>;
    // children: Snippet<[id: string, name: string, error: string | undefined, touched: boolean]>;
  };
  let { schema, path }: Props = $props();
  let pathInfo = $derived(formPath(schema, path));
</script>

<div class="space-y-2">
  {pathInfo.formName}
</div>
