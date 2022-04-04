import type IndexAntibiogramTitleAction from '@/application/IndexAntibiogramTitleAction';
import type WebAntibiogramTitlePresenter from '@/infrastructure/view/presenters/WebAntibiogramTitlePresenter';
import type { AntibiogramTitle } from '@/infrastructure/view/presenters/WebAntibiogramTitlePresenter';

class AntibiogramTitleController {
  #action: IndexAntibiogramTitleAction;
  #presenter: WebAntibiogramTitlePresenter;

  constructor(
    indexAntibiogramTitleAction: IndexAntibiogramTitleAction,
    webAntibiogramTitlePresenter: WebAntibiogramTitlePresenter
  ) {
    this.#action = indexAntibiogramTitleAction;
    this.#presenter = webAntibiogramTitlePresenter;
  }

  async index(): Promise<AntibiogramTitle[] | null> {
    await this.#action.present(this.#presenter);
    return this.#presenter.buildViewModel();
  }
}

export default AntibiogramTitleController;
