import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';

interface BaseTable<T extends Cell> {
  getData(): T[][];
  getShape(): [number, number];
  getRowLabels(): Label[];
  getColumnLabels(): Label[];
}

export type { BaseTable };
