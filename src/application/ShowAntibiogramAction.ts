import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
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

  async execute(params: ShowAntibiogramActionParams): Promise<Table> {
    const [abg] = await this.antibiogramRepository.getAll();
    const table = makeAntibiogramTable(abg);
    return table;
  }
}

export default ShowAntibiogramAction;
export type { ShowAntibiogramActionParams };
