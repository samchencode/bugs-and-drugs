import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';
import type { Group } from '@/domain/Table/Group';

interface Table<T extends Cell> {
  getData(): T[][];
  getShape(): [number, number];
  getRowLabels(): Label[];
  getColumnLabels(): Label[];
  getRowGroups(): Group[];
}

export type { Table };
