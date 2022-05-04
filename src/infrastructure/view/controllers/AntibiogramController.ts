import type ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import type ShowGramPositiveAndNegativeAntibiogramAction from '@/application/ShowGramPositiveAndNegativeAntibiogramAction';
import WebAntibiogramPresenter, {
  type WebAntibiogram,
} from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
import WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';

class AntibiogramController {
  #showOne: ShowAntibiogramAction;
  #showComposite: ShowGramPositiveAndNegativeAntibiogramAction;

  constructor(
    showAntibiogramAction: ShowAntibiogramAction,
    showGramPositiveAndNegativeAntibiogramAction: ShowGramPositiveAndNegativeAntibiogramAction
  ) {
    this.#showOne = showAntibiogramAction;
    this.#showComposite = showGramPositiveAndNegativeAntibiogramAction;
  }

  async show(id: string) {
    const presenter = new WebAntibiogramPresenter(new WebTablePresenter());
    await this.#showOne.present(presenter, id);
    return presenter.buildViewModel();
  }

  async showComposite(id1: string, id2: string) {
    const presenter = new WebAntibiogramPresenter(new WebTablePresenter());
    await this.#showComposite.present(presenter, id1, id2);
    return presenter.buildViewModel();
  }

  async showMany(ids: string[]) {
    const promises = ids.map((id) => this.show(id));
    const abgs = await Promise.all(promises);

    return this.#sortAntibiograms(abgs);
  }

  #sortAntibiograms(abgs: (WebAntibiogram | null)[]) {
    abgs.sort((v1, v2) => (v1 && v2 ? (v1?.gram > v2?.gram ? 1 : -1) : 0));
    return abgs;
  }
}

export default AntibiogramController;
