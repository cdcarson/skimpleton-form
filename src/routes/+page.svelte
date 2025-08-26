<script lang="ts">
	import ControlContainer from '$lib/ui/ControlContainer.svelte';
	import { z } from 'zod';

  

	// Simple schema for basic examples
	const simpleSchema = z.object({
		name: z.string(),
		age: z.number()
	});

	// 3-level deep schema to demonstrate the new capabilities
	const deepSchema = z.object({
		user: z.object({
			profile: z.object({
				firstName: z.string(),
				lastName: z.string(),
				email: z.email()
			}),
			settings: z.object({
				theme: z.enum(['light', 'dark']),
				notifications: z.boolean()
			})
		}),
		company: z.object({
			info: z.object({
				name: z.string(),
				founded: z.number()
			}),
			tags: z.array(z.string())
		})
	});
</script>

<h1>Form Path Type Safety Demo</h1>
<p>This library provides type-safe form paths with up to 3 levels of depth</p>

<h2>Simple Schema Example</h2>
<ControlContainer schema={simpleSchema} path={['name']} />
<ControlContainer schema={simpleSchema} path="age" />

<h2>3-Level Deep Schema Example</h2>
<!-- Object.Object.Field -->
<ControlContainer schema={deepSchema} path="user.profile.firstName" />
<ControlContainer schema={deepSchema} path={['user', 'settings', 'theme']} />

<!-- Object.Object.Field (3 levels) -->
<ControlContainer schema={deepSchema} path="company.info.name" />

<!-- Object.Array.Index -->
<ControlContainer schema={deepSchema} path="company.tags.0" />

<!-- Type safety: These would show errors in your IDE -->
<!-- <ControlContainer schema={deepSchema} path="user.profile.invalid" /> -->
<!-- <ControlContainer schema={deepSchema} path="user.profile.firstName.tooDeep" /> -->
