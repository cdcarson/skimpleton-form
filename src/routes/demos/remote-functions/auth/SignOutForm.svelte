<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppMessageService } from '$lib/message/app-message.svelte.js';
  import { signOut } from './data.remote.js';
  type Props = {
    formId: string;
  };
  const msg = AppMessageService.get();
  let { formId }: Props = $props();
</script>

<form
  id={formId}
  {...signOut.enhance(async ({ submit }) => {
    try {
     
      await submit();
      if (!signOut.result) {
        throw new Error('Missing result');
      }
      if (signOut.result.success) {
        msg.success(signOut.result.success.message);
        await goto(signOut.result.success.location);
        return;
      }
      throw new Error('Missing result');
    } catch (error) {
      
      msg.clear();
    }
  })}
  
></form>