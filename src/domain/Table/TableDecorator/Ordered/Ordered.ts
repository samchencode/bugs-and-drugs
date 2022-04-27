import type Cell from '@/domain/Table/Cell';
import type { Group } from '@/domain/Table/Group';
import type Label from '@/domain/Table/Label';
import type { Table } from '@/domain/Table/Table';
import SortBehavior from '@/domain/Table/TableDecorator/Ordered/SortBehavior';
import type { TableDecorator } from '@/domain/Table/TableDecorator/TableDecorator';
import type { TableParams } from '@/domain/Table/TableParams';

class Ordered<T extends Cell> implements TableDecorator<T> {
  #table: Table<T>;
  #rowBehavior?: SortBehavior;
  #columnBehavior?: SortBehavior;
  #params: TableParams['order'];

  constructor(table: Table<T>, order: TableParams['order']) {
    this.#table = table;
    this.#params = order;

    const columnLabels = table.getColumnLabels().map((l) => l.toString());
    const rowLabels = table.getRowLabels().map((l) => l.toString());

    this.#rowBehavior = order.rows && new SortBehavior(order.rows, rowLabels);
    this.#columnBehavior =
      order.columns && new SortBehavior(order.columns, columnLabels);
  }

  getData(): T[][] {
    let data = this.#table.getData();
    if (this.#rowBehavior) data = this.#rowBehavior.arrange(data);
    if (this.#columnBehavior) data = this.#columnBehavior.arrangeColumns(data);
    return data;
  }

  getShape(): [number, number] {
    return this.#table.getShape();
  }

  getRowLabels(): Label[] {
    const labels = this.#table.getRowLabels();
    return this.#rowBehavior ? this.#rowBehavior.arrange(labels) : labels;
  }

  getColumnLabels(): Label[] {
    const labels = this.#table.getColumnLabels();
    return this.#columnBehavior ? this.#columnBehavior.arrange(labels) : labels;
  }

  getRowGroups(): Group[] {
    return this.#table.getRowGroups();
  }

  clone(params: Partial<TableParams>): Table<T> {
    return new Ordered(this.#table.clone(params), {
      ...this.#params,
      ...params.order,
    });
  }
}

export default Ordered;
