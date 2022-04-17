import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import type WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';

class TableController {
  #action: ShowAntibiogramAction;
  #presenter: WebTablePresenter;

  constructor(
    showAntibiogramAction: ShowAntibiogramAction,
    webTablePresenter: WebTablePresenter
  ) {
    this.#action = showAntibiogramAction;
    this.#presenter = webTablePresenter;
  }

  async show(id: string) {
    await this.#action.present(this.#presenter, id);
    return this.#presenter.buildViewModel();
  }
}

export default TableController;
