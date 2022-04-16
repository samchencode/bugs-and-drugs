import type Antibiogram from '@/domain/Antibiogram';

interface AntibiogramGroupPresenter {
  setData(data: Antibiogram[]): void;
}

export type { AntibiogramGroupPresenter };
