import type { Table } from '@/domain/Table/Table';
import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';
import type { Group } from '@/domain/Table/Group';
import CollapseBehavior from '@/domain/Table/TableDecorator/RowCollapsible/CollapseBehavior';
import type { TableDecorator } from '@/domain/Table/TableDecorator/TableDecorator';
import type { TableParams } from '@/domain/Table/TableParams';

class RowCollapsible<T extends Cell> implements TableDecorator<T> {
  #table: Table<T>;
  #collapse: CollapseBehavior<T>;

  constructor(table: Table<T>) {
    this.#table = table;

    const rowGroups = table.getRowGroups();
    const hiddenRanges = rowGroups
      .filter((g) => g.isCollapsed())
      .map<[number, number]>((g) => [
        g.getExpandedRange()[0] + 1,
        g.getExpandedRange()[1],
      ]);
    this.#collapse = new CollapseBehavior(hiddenRanges);
  }

  getRowGroups(): Group[] {
    const rowGroups = this.#table.getRowGroups();
    return this.#collapse.collapseGroups(rowGroups);
  }

  getData(): T[][] {
    const data = this.#table.getData();
    return this.#collapse.filterData(data);
  }

  getShape(): [number, number] {
    const [r, c] = this.#table.getShape();
    const collapsedRows = this.#collapse.findNumberOfCollapsedRows();
    return [r - collapsedRows, c];
  }

  getRowLabels(): Label[] {
    const labels = this.#table.getRowLabels();
    return this.#collapse.filterLabels(labels);
  }

  getColumnLabels(): Label[] {
    return this.#table.getColumnLabels();
  }

  clone(params: Partial<TableParams>): Table<T> {
    const newInnerTable = this.#table.clone(params);
    return new RowCollapsible(newInnerTable);
  }
}

export default RowCollapsible;
