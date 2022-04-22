import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import WebAntibiogramPresenter from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
import WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';

class AntibiogramController {
  #action: ShowAntibiogramAction;
  #presenter: WebAntibiogramPresenter;

  constructor(
    showAntibiogramAction: ShowAntibiogramAction,
    webAntibiogramPresenter: WebAntibiogramPresenter
  ) {
    this.#action = showAntibiogramAction;
    this.#presenter = new WebAntibiogramPresenter(new WebTablePresenter());
  }

  async show(id: string) {
    console.log(id, this.#presenter);
    await this.#action.present(this.#presenter, id);
    return this.#presenter.buildViewModel();
  }
}

export default AntibiogramController;
