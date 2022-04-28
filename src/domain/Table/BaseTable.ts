import type Cell from '@/domain/Table/Cell';
import type TableLabels from '@/domain/Table/TableLabels';
import {
  EmptyTableLabels,
  FilledTableLabels,
} from '@/domain/Table/TableLabels';
import type { Table } from '@/domain/Table/Table';
import type { TableParams } from '@/domain/Table/TableParams';
import type { Group } from '@/domain/Table/Group';
import CompositeTable from '@/domain/Table/CompositeTable';

class BaseTable<T extends Cell> implements Table<T> {
  #data: T[][];
  #labels: TableLabels;
  #rowGroups: Group[];
  #params: Partial<TableParams>;

  constructor(data: T[][], params: Partial<TableParams> = {}) {
    const { labels, groups } = params;
    this.#params = params;
    this.#data = data;

    this.#labels = labels
      ? new FilledTableLabels(labels.rows, labels.columns)
      : new EmptyTableLabels(...this.getShape());

    this.#rowGroups = groups?.rows ?? [];
  }

  getRowGroups(): Group[] {
    return this.#rowGroups;
  }

  getData() {
    return this.#data;
  }

  getShape(): [number, number] {
    return [this.#data.length, this.#data[0]?.length ?? 0];
  }

  getRowLabels() {
    return this.#labels.getRowLabels();
  }

  getColumnLabels() {
    return this.#labels.getColumnLabels();
  }

  clone(params: Partial<TableParams>): Table<T> {
    const newParams = {
      ...this.#params,
      ...params,
    };
    return new BaseTable<T>(this.#data, newParams);
  }

  merge(table: Table<T>): Table<T> {
    return new CompositeTable(this, table);
  }
}

export default BaseTable;
