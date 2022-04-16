import type Antibiogram from '@/domain/Antibiogram';

interface AntibiogramPresenter {
  setData(data: Antibiogram[]): void;
}

export type { AntibiogramPresenter };
