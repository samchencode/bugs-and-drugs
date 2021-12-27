import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import type { Presenter } from '@/domain/ports/Presenter';
import makeAntibiogramTable from '@/domain/makeAntibiogramTable';

interface ShowAntibiogramActionParams {
  id: number;
}

class ShowAntibiogramAction {
  antibiogramRepository: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.antibiogramRepository = antibiogramRepository;
  }

  execute(params: ShowAntibiogramActionParams, presenter: Presenter) {
    const abg = this.antibiogramRepository.getAll()[0];
    const table = makeAntibiogramTable(abg);
    presenter.showTable(table);
  }
}

export default ShowAntibiogramAction;
