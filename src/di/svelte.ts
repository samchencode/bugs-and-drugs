import App from '@/infrastructure/view/templates/App.svelte';
import type AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
import type AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';

const svelte = (
  antibiogramController: AntibiogramController,
  antibiogramGroupController: AntibiogramGroupController
) => {
  return new App({
    target: document.body,
    context: new Map<string, unknown>([
      ['antibiogramController', antibiogramController],
      ['antibiogramGroupController', antibiogramGroupController],
    ]),
  });
};

export default svelte;
