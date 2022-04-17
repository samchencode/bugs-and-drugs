import TableViewScreen from '@/infrastructure/view/templates/table-view-screen/TableViewScreen.svelte';
import IndexScreen from '@/infrastructure/view/templates/index-screen/IndexScreen.svelte';

const routes = {
  // Exact path
  '/': IndexScreen,

  // Using named parameters, with last being optional
  '/antibiogram': TableViewScreen,

  // Catch-all
  // This is optional, but if present it must be the last
  // '*': NotFound,
};

export default routes;
