import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';
import type { Group } from '@/domain/Table/Group';
import type { TableParams } from '@/domain/Table/TableParams';

interface Table<T extends Cell> {
  getData(): T[][];
  getShape(): [number, number];
  getRowLabels(): Label[];
  getColumnLabels(): Label[];
  getRowGroups(): Group[];
  clone(params: Partial<TableParams>): Table<T>;
}

export type { Table };
