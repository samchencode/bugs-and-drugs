import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import buildAntibiogramTable from '@/domain/AntibiogramTableBuilder';
import type { Table } from '@/domain/Table';
import { AntibiogramId } from '@/domain/Antibiogram';

class ShowAntibiogramAction {
  antibiogramRepository: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.antibiogramRepository = antibiogramRepository;
  }

  async execute(id: string): Promise<Table> {
    const abgId = new AntibiogramId(id);
    const abg = await this.antibiogramRepository.getById(abgId);
    const table = buildAntibiogramTable(abg);
    return table;
  }
}

export default ShowAntibiogramAction;
