import type Cell from '@/domain/Table/Cell';
import type TableLabels from '@/domain/Table/TableLabels';
import {
  EmptyTableLabels,
  FilledTableLabels,
} from '@/domain/Table/TableLabels';
import type { Table } from '@/domain/Table/Table';
import type { TableParams } from '@/domain/Table/TableParams';
import type { Group } from '@/domain/Table/Group';

class BaseTable<T extends Cell> implements Table<T> {
  #data: T[][];
  #labels: TableLabels;
  #rowGroups: Group[] = [];

  constructor(data: T[][], params?: Partial<TableParams>) {
    const { labels, groups } = params ?? {};
    this.#data = data;
    const [nRow, nCol] = this.getShape();
    if (!labels) this.#labels = new EmptyTableLabels(nRow, nCol);
    else this.#labels = new FilledTableLabels(labels.rows, labels.columns);

    if (groups) this.#rowGroups = groups.rows;
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
}

export default BaseTable;
