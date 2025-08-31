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


