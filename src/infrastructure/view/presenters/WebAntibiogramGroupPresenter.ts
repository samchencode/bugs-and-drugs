import type {
  AntibiogramGroup,
  AntibiogramGroupPresenter,
} from '@/domain/ports/AntibiogramGroupPresenter';

type WebAntibiogramGroup = {
  institution: string;
  state: string;
  interval: string;
};

class WebAntibiogramGroupPresenter implements AntibiogramGroupPresenter {
  #data: AntibiogramGroup[] | null = null;

  setData(data: AntibiogramGroup[]): void {
    this.#data = data;
  }

  buildViewModel(): WebAntibiogramGroup[] | null {
    if (this.#data === null) return null;
    return this.#data.map((g) => ({
      institution: g.place.getInstitution(),
      state: g.place.getState(),
      interval: g.interval.toString(),
    }));
  }
}

export default WebAntibiogramGroupPresenter;
export type { WebAntibiogramGroup };
