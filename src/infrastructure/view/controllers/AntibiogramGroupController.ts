import type IndexAntibiogramAction from '@/application/IndexAntibiogramAction';
import type WebAntibiogramGroupPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';
import type { WebAntibiogramGroup } from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';

class AntibiogramGroupController {
  #action: IndexAntibiogramAction;
  #presenter: WebAntibiogramGroupPresenter;

  constructor(
    indexAntibiogramGroupsAction: IndexAntibiogramAction,
    webAntibiogramGroupsPresenter: WebAntibiogramGroupPresenter
  ) {
    this.#action = indexAntibiogramGroupsAction;
    this.#presenter = webAntibiogramGroupsPresenter;
  }

  async index(): Promise<WebAntibiogramGroup[] | null> {
    await this.#action.present(this.#presenter);
    return this.#presenter.buildViewModel();
  }
}

export default AntibiogramGroupController;
