import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import buildAntibiogramTable from '@/domain/AntibiogramTableBuilder';
import type { Table } from '@/domain/Table';

interface ShowAntibiogramActionParams {
  id: number;
}

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
