interface AntibiogramTitle {
  state: string;
  institution: string;
  interval: string;
  details: string;
  gramStain: string;
  id: number;
}

interface AntibiogramTitlePresenter {
  setData(data: AntibiogramTitle[]): void;
}

export type { AntibiogramTitlePresenter, AntibiogramTitle };
