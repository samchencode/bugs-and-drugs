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

  async showMany(ids: string[]) {
    const promises = ids.map((id) => this.show(id));
    const abgs = await Promise.all(promises);

    return abgs;
  }
}

export default AntibiogramController;
