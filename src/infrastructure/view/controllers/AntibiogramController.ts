import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import type WebAntibiogramPresenter from '@/infrastructure/view/presenters/WebAntibiogramPresenter';

class AntibiogramController {
  #action: ShowAntibiogramAction;
  #presenter: WebAntibiogramPresenter;

  constructor(
    showAntibiogramAction: ShowAntibiogramAction,
    webAntibiogramPresenter: WebAntibiogramPresenter
  ) {
    this.#action = showAntibiogramAction;
    this.#presenter = webAntibiogramPresenter;
  }

  async show(id: string) {
    await this.#action.present(this.#presenter, id);
    return this.#presenter.buildViewModel();
  }
}

export default AntibiogramController;
