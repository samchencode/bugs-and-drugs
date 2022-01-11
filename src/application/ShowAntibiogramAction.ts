import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import buildAntibiogramTable from '@/domain/AntibiogramTableBuilder';

interface ShowAntibiogramActionParams {
  id: number;
}

type Table = ReturnType<typeof buildAntibiogramTable>;

class ShowAntibiogramAction {
  antibiogramRepository: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.antibiogramRepository = antibiogramRepository;
  }

  async execute(id: number): Promise<Table> {
    const abg = (await this.antibiogramRepository.getAll())[id];
    const table = buildAntibiogramTable(abg);
    return table;
  }
}

export default ShowAntibiogramAction;
export type { ShowAntibiogramActionParams };
