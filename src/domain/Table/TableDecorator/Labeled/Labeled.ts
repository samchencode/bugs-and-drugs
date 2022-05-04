import type Cell from '@/domain/Table/Cell';
import { EmptyCell } from '@/domain/Table/Cell';
import CompositeTable from '@/domain/Table/CompositeTable';
import type { Group } from '@/domain/Table/Group';
import Label from '@/domain/Table/Label/Label';
import type { Table } from '@/domain/Table/Table';
import type { TableDecorator } from '@/domain/Table/TableDecorator/TableDecorator';
import type { TableParams } from '@/domain/Table/TableParams';

class Labeled<T extends Cell> implements TableDecorator<T> {
  #table: Table<T>;
  #label: TableParams['label'];
  #makeEmptyCell: () => T = defaultMakeEmptyCell;

  constructor(
    table: Table<T>,
    label: TableParams['label'],
    makeEmptyCell: () => T = defaultMakeEmptyCell
  ) {
    this.#table = table;
    this.#label = label;
    this.#makeEmptyCell = makeEmptyCell;
  }

  getData(): T[][] {
    const data = this.#table.getData().slice();
    data.splice(0, 0, new Array(data[0].length).fill(this.#makeEmptyCell()));
    return data;
  }

  getShape(): [number, number] {
    const [r, c] = this.#table.getShape();
    return [r + 1, c]; //add one row for the label
  }

  getRowLabels(): Label[] {
    const labels = this.#table.getRowLabels();
    labels.splice(0, 0, new Label(this.#label, { bold: true }));
    return labels;
  }

  getColumnLabels(): Label[] {
    const labels = this.#table.getColumnLabels();
    return labels;
  }

  getRowGroups(): Group[] {
    return this.#table.getRowGroups();
  }

  clone(params: Partial<TableParams>): Table<T> {
    const table = this.#table.clone(params);
    return new Labeled<T>(table, this.#label);
  }

  merge(table: Table<T>): Table<T> {
    return new CompositeTable(this, table);
  }
}
function defaultMakeEmptyCell<T extends Cell>(): T {
  return new EmptyCell() as T;
}

export default Labeled;
