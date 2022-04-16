import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import type { AntibiogramGroupPresenter } from '@/domain/ports/AntibiogramGroupPresenter';
import type Antibiogram from '@/domain/Antibiogram';

class IndexAntibiogramAction {
  #repo: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.#repo = antibiogramRepository;
  }

  async execute(): Promise<Antibiogram[]> {
    return await this.#repo.getAll();
  }

  async present(p: AntibiogramGroupPresenter) {
    const result = await this.execute();
    p.setData(result);
    return p;
  }
}

export default IndexAntibiogramAction;
