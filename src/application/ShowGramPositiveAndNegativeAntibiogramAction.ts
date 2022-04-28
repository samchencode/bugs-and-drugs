import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import buildAntibiogramTable from '@/domain/AntibiogramTableBuilder';
import { AntibiogramId } from '@/domain/Antibiogram';
import type {
  AntibiogramPresenter,
  AntibiogramData,
} from '@/domain/ports/AntibiogramPresenter';

class ShowGramPositiveAndNegativeAntibiogramAction {
  antibiogramRepository: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.antibiogramRepository = antibiogramRepository;
  }

  async execute(id1: string, id2: string): Promise<AntibiogramData> {
    const abgId1 = new AntibiogramId(id1);
    const antibiogram1 = await this.antibiogramRepository.getById(abgId1);
    const abgId2 = new AntibiogramId(id2);
    const antibiogram2 = await this.antibiogramRepository.getById(abgId2);
    const table = buildAntibiogramTable(antibiogram1, antibiogram2);
    return { antibiogram: antibiogram1, table };
  }

  async present(p: AntibiogramPresenter, id1: string, id2: string) {
    const result = await this.execute(id1, id2);
    p.setData(result);
    return p;
  }
}

export default ShowGramPositiveAndNegativeAntibiogramAction;
