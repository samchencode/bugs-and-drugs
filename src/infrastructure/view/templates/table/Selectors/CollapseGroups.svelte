<script lang="ts">
  import { state } from '@/infrastructure/view/templates/table/tableStore';
</script>

<button
  class="tool-bar-button vertically-center"
  on:click={() => state.collapseAllGroups(0)}
>
  <span>Collapse Groups</span>
</button>
