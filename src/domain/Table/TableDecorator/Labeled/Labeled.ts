import type Cell from '@/domain/Table/Cell';
import CompositeTable from '@/domain/Table/CompositeTable';
import type { Group } from '@/domain/Table/Group';
import Label from '@/domain/Table/Label/Label';
import type { Table } from '@/domain/Table/Table';
import type { TableDecorator } from '@/domain/Table/TableDecorator/TableDecorator';
import type { TableParams } from '@/domain/Table/TableParams';

class Labeled<T extends Cell> implements TableDecorator<T> {
  #table: Table<T>;
  #label: string;

  constructor(table: Table<T>, label: string) {
    this.#table = table;
    this.#label = label;
  }

  getData(): T[][] {
    let data = this.#table.getData();
    if (this.#label) data = data.splice(0, 0, new Array(data[0].length));
    return data;
  }

  getShape(): [number, number] {
    return this.#table.getShape();
  }

  getRowLabels(): Label[] {
    const labels = this.#table.getRowLabels();
    return labels.splice(0, 0, new Label(this.#label));
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

export default Labeled;
