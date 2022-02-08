import type IndexAntibiogramGroupsAction from '@/application/IndexAntibiogramGroupsAction';
import type WebAntibiogramGroupsPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';
import type { WebAntibiogramGroup } from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';

class AntibiogramGroupController {
  #action: IndexAntibiogramGroupsAction;
  #presenter: WebAntibiogramGroupsPresenter;

  constructor(
    indexAntibiogramGroupsAction: IndexAntibiogramGroupsAction,
    webAntibiogramGroupsPresenter: WebAntibiogramGroupsPresenter
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
