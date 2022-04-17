import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import buildAntibiogramTable from '@/domain/AntibiogramTableBuilder';
import { AntibiogramId } from '@/domain/Antibiogram';
import type {
  AntibiogramPresenter,
  AntibiogramData,
} from '@/domain/ports/AntibiogramPresenter';

class ShowAntibiogramAction {
  antibiogramRepository: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.antibiogramRepository = antibiogramRepository;
  }

  async execute(id: string): Promise<AntibiogramData> {
    const abgId = new AntibiogramId(id);
    const antibiogram = await this.antibiogramRepository.getById(abgId);
    const table = buildAntibiogramTable(antibiogram);
    return { antibiogram, table };
  }

  async present(p: AntibiogramPresenter, id: string) {
    const result = await this.execute(id);
    p.setData(result);
    return p;
  }
}

export default ShowAntibiogramAction;
