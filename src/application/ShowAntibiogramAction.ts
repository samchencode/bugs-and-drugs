import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import type { Presenter } from '@/domain/ports/Presenter';
import makeAntibiogramTable from '@/domain/makeAntibiogramTable';

interface ShowAntibiogramActionParams {
  id: number;
}

type Table = ReturnType<typeof makeAntibiogramTable>;

class ShowAntibiogramAction {
  antibiogramRepository: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.antibiogramRepository = antibiogramRepository;
  }

  execute(params: ShowAntibiogramActionParams, callback: (t: Table) => void) {
    const abg = this.antibiogramRepository.getAll()[0];
    const table = makeAntibiogramTable(abg);
    callback(table);
  }
}

export default ShowAntibiogramAction;
