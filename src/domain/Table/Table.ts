import type Cell from '@/domain/Table/Cell';
import type TableLabels from '@/domain/Table/TableLabels';
import {
  EmptyTableLabels,
  FilledTableLabels,
} from '@/domain/Table/TableLabels';
import CollapseBehavior from '@/domain/Table/CollapseBehavior';
import type { BaseTable } from '@/domain/Table/BaseTable';
import type { TableParams } from '@/domain/Table/TableParams';

class Table<T extends Cell> implements BaseTable<T> {
  data: T[][];
  labels: TableLabels;
  rowCollapse: CollapseBehavior<T>;

  constructor(data: T[][], params?: Partial<TableParams>) {
    this.data = data;

    const { labels } = params ?? {};
    if (!labels)
      this.labels = new EmptyTableLabels(
        this.getShape()[0],
        this.getShape()[1]
      );
    else this.labels = new FilledTableLabels(labels.rows, labels.columns);

    const { groups } = params ?? {};
    if (groups) {
      const collapseRanges = groups.rows
        .filter((g) => g.collapsed)
        .map((g) => g.range);
      this.rowCollapse = new CollapseBehavior(collapseRanges);
    } else this.rowCollapse = new CollapseBehavior([]);
  }

  getData() {
    return this.rowCollapse.filterData(this.data);
  }

  getShape(): [number, number] {
    return [this.data.length, this.data[0]?.length ?? 0];
  }

  getRowLabels() {
    return this.rowCollapse.filterLabels(this.labels.getRowLabels());
  }

  getColumnLabels() {
    return this.labels.getColumnLabels();
  }
}

export default Table;
