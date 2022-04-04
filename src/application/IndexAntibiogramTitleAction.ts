import type { AntibiogramTitlePresenter } from '@/domain/ports/AntibiogramTitlePresenter';

interface AntibiogramTitle {
  state: string;
  institution: string;
  interval: string;
  details: string;
  gramStain: string;
  id: number;
}
class IndexAntibiogramTitleAction {
  #repo: AntibiogramTitle[];

  constructor() {
    this.#repo = [
      {
        state: 'Binghamton, NY',
        institution: 'Lourdes',
        interval: 'June 2019-June 2020',
        details: 'inpatient',
        gramStain: 'positive',
        id: 1,
      },
      {
        state: 'Binghamton, NY',
        institution: 'Lourdes',
        interval: 'June 2019-June 2020',
        details: 'inpatient',
        gramStain: 'negative',
        id: 2,
      },
      {
        state: 'Binghamton, NY',
        institution: 'Lourdes',
        interval: 'June 2019-June 2020',
        details: 'outpatient',
        gramStain: 'positive',
        id: 3,
      },
      {
        state: 'Binghamton, NY',
        institution: 'Lourdes',
        interval: 'June 2019-June 2020',
        details: 'outpatient',
        gramStain: 'negative',
        id: 4,
      },
      {
        state: 'Binghamton, NY',
        institution: 'UHS',
        interval: 'January 2020-January 2021',
        details: 'non-urine',
        gramStain: 'negative',
        id: 5,
      },
      {
        state: 'Binghamton, NY',
        institution: 'UHS',
        interval: 'January 2020-January 2021',
        details: 'non-urine',
        gramStain: 'positive',
        id: 6,
      },
      {
        state: 'Binghamton, NY',
        institution: 'UHS',
        interval: 'January 2020-January 2021',
        details: 'urine',
        gramStain: 'unspecified',
        id: 7,
      },
    ];
  }

  async present(p: AntibiogramTitlePresenter) {
    const result = await this.execute();
    p.setData(result);
    return p;
  }

  async execute(): Promise<AntibiogramTitle[]> {
    return this.#repo;
  }
}

export default IndexAntibiogramTitleAction;
