import type Antibiogram from '@/domain/Antibiogram';
import type { Table } from '@/domain/Table';

type AntibiogramData = {
  antibiogram: Antibiogram;
  table: Table;
};

interface AntibiogramPresenter {
  setData(data: AntibiogramData): void;
}

export type { AntibiogramPresenter, AntibiogramData };
