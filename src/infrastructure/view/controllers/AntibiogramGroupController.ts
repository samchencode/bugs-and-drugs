import type IndexAntibiogramAction from '@/application/IndexAntibiogramAction';
import WebAntibiogramGroupPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';
import type { WebAntibiogramGroup } from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';

class AntibiogramGroupController {
  #action: IndexAntibiogramAction;

  constructor(indexAntibiogramGroupsAction: IndexAntibiogramAction) {
    this.#action = indexAntibiogramGroupsAction;
  }

  async index(): Promise<WebAntibiogramGroup[] | null> {
    const presenter = new WebAntibiogramGroupPresenter();
    await this.#action.present(presenter);
    return presenter.buildViewModel();
  }
}

export default AntibiogramGroupController;
