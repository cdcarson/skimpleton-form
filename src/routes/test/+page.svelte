<script lang="ts"> 
  import PopoverModal from '$demo/ui/modals/PopoverModal.svelte';
</script>

<button popovertarget="popover-modal">Open Popover</button>

<PopoverModal id="popover-modal" title="Popover Modal">
  <button>Something to focus</button>
</PopoverModal>