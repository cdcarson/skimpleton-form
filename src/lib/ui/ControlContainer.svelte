<script lang="ts" generics="S extends ZFormObject">
  import type { Snippet } from 'svelte';
  import { formPath } from '$lib/form/utils.js';
  import type {
    ZFormObject,
    ZFormPaths,
    ZDotPaths,
    BaseFormClientState
  } from '$lib/form/types.js';
  type Props = {
    schema: S;
    path: ZFormPaths<S>;
    form: BaseFormClientState<S>;
    children: Snippet<
      [id: string, name: string, error: string | undefined, touched: boolean]
    >;
    class?: string;
  };
  let { schema, path, form, children, class: className }: Props = $props();
  let pathInfo = $derived(formPath(schema, path));
  let id = $derived(form.controlId(path));
  let name = $derived(form.controlName(path));
  let error = $derived(form.shownErrors[pathInfo.formName as ZDotPaths<S>]);
  let touched = $derived(form.touched[pathInfo.formName as ZDotPaths<S>]);
</script>

<div class={className}>
  {@render children(id, name, error, touched ?? false)}
</div>
