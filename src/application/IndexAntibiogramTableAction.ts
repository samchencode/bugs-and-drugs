import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import buildAntibiogramTable from '@/domain/AntibiogramTableBuilder';
import type { Table } from '@/domain/Table';

class IndexAntibiogramTableAction {
  antibiogramRepository: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.antibiogramRepository = antibiogramRepository;
  }

  async execute(): Promise<Table[]> {
    const abgs = await this.antibiogramRepository.getAll();
    const tables = abgs.map((a) => buildAntibiogramTable(a));
    return tables;
  }
}

export default IndexAntibiogramTableAction;
