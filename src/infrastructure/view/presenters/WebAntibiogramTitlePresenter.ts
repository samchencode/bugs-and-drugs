import type {
  AntibiogramTitle,
  AntibiogramTitlePresenter,
} from '@/domain/ports/AntibiogramTitlePresenter';

class WebAntibiogramTitlePresenter implements AntibiogramTitlePresenter {
  #data: AntibiogramTitle[] | null = null;

  setData(data: AntibiogramTitle[]): void {
    this.#data = data;
  }

  buildViewModel(): AntibiogramTitle[] | null {
    if (this.#data === null) return null;
    return this.#data.map((g) => ({
      state: g.state,
      institution: g.institution,
      interval: g.interval,
      details: g.details,
      gramStain: g.gramStain,
      id: g.id,
    }));
  }
}

export default WebAntibiogramTitlePresenter;
export type { AntibiogramTitle };
