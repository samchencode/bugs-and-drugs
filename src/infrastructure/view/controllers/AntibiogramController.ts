import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import WebAntibiogramPresenter from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
import WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';

class AntibiogramController {
  #action: ShowAntibiogramAction;

  constructor(showAntibiogramAction: ShowAntibiogramAction) {
    this.#action = showAntibiogramAction;
  }

  async show(id: string) {
    const presenter = new WebAntibiogramPresenter(new WebTablePresenter());
    await this.#action.present(presenter, id);
    return presenter.buildViewModel();
  }
}

export default AntibiogramController;
