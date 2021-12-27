import type { AntibiogramTable } from '@/domain/makeAntibiogramTable';

interface Presenter {
  showTable(t: AntibiogramTable): void;
}

export type { Presenter };
