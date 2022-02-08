<script lang="ts">
  import { state } from '@/infrastructure/view/templates/table/tableStore';
</script>

<button
  class="tool-bar-button vertically-center"
  on:click={() => state.expandAllGroups(0)}
>
  <span>Expand Groups</span>
</button>
