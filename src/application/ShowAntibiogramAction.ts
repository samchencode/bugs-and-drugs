import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import buildAntibiogramTable from '@/domain/AntibiogramTableBuilder';
import type { Table } from '@/domain/Table';
import { AntibiogramId } from '@/domain/Antibiogram';
import type { TablePresenter } from '@/domain/ports/TablePresenter';

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

  async present(p: TablePresenter, id: string) {
    const result = await this.execute(id);
    p.setData(result);
    return p;
  }
}

export default ShowAntibiogramAction;
