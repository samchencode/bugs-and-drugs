import App from '@/infrastructure/view/templates/App.svelte';
import type TableController from '@/infrastructure/view/controllers/TableController';
import type AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';

const svelte = (
  tableController: TableController,
  antibiogramGroupController: AntibiogramGroupController
) => {
  return new App({
    target: document.body,
    context: new Map<string, unknown>([
      ['tableController', tableController],
      ['antibiogramGroupController', antibiogramGroupController],
    ]),
  });
};

export default svelte;
