<script lang="ts">
  import { state } from '@/infrastructure/view/templates/table/tableStore';
</script>

<button
  class="tool-bar-button vertically-center"
  on:click={() => state.collapseAllGroups()}
>
  <span>Collapse Groups</span>
</button>
