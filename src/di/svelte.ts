import App from '@/infrastructure/view/templates/App.svelte';
import type TableController from '@/infrastructure/view/controllers/TableController';
import type AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
import type AntibiogramTitleController from '@/infrastructure/view/controllers/AntibiogramTitleController';

const svelte = (
  tableController: TableController,
  antibiogramGroupController: AntibiogramGroupController,
  antibiogramTitleController: AntibiogramTitleController
) => {
  return new App({
    target: document.body,
    context: new Map<string, unknown>([
      ['tableController', tableController],
      ['antibiogramGroupController', antibiogramGroupController],
      ['antibiogramTitleController', antibiogramTitleController],
    ]),
  });
};

export default svelte;
