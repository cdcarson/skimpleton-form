<script lang="ts" generics="S extends ZParentObject">
	import type { FormPaths, ZParentObject } from '$lib/form-paths/types.js';
	// import type { Snippet } from 'svelte';
	import { formPath } from '$lib/form-paths/utils.js';

	type Props = {
		schema: S;
		path: FormPaths<S>;
		// children: Snippet<[id: string, name: string, error: string | undefined, touched: boolean]>;
	};
	let { schema, path }: Props = $props();
	let pathInfo = $derived(formPath(schema, path));
</script>

<div class="space-y-2">
	{pathInfo.formName}
</div>
