import ValueObject from '@/domain/base/ValueObject';
import validate from '@/domain/Table/Validator';
import rules from '@/domain/Table/rules';
import type Cell from '@/domain/Table/Cell';
import type TableLabels from '@/domain/Table/TableLabels';
import {
  EmptyTableLabels,
  FilledTableLabels,
} from '@/domain/Table/TableLabels';
import CollapseBehavior from '@/domain/Table/CollapseBehavior';

interface TableParams {
  labels: {
    rows: string[];
    columns: string[];
  };
  groups: {
    rows: {
      range: [number, number];
      collapsed: boolean;
    }[];
  };
}

class Table<T extends Cell> extends ValueObject {
  data: T[][];
  labels: TableLabels;
  rowCollapse: CollapseBehavior;

  constructor(data: T[][], params?: Partial<TableParams>) {
    super();
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

  getShape() {
    return [this.data.length, this.data[0]?.length ?? 0];
  }

  getRowLabels() {
    return this.rowCollapse.filterLabels(this.labels.getRowLabels());
  }

  getColumnLabels() {
    return this.labels.getColumnLabels();
  }

  static makeTable<T extends Cell>(data: T[][], params?: Partial<TableParams>) {
    validate(rules(data, params));
    return new this(data, params);
  }

  protected isIdentical(t: Table<T>) {
    const data = t.getData();
    const ourData = this.getData();
    if (t.getShape()[0] !== this.getShape()[0]) return false;
    if (t.getShape()[1] !== this.getShape()[1]) return false;

    for (const [i, row] of data.entries()) {
      for (const [j, cell] of row.entries()) {
        if (!cell.is(ourData[i][j])) return false;
      }
    }

    return true;
  }
}

export default Table;
export type { TableParams };
