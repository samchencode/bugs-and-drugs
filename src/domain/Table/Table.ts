import ValueObject from '@/domain/base/ValueObject';
import validate from '@/domain/Table/Validator';
import rules from '@/domain/Table/rules';
import type Cell from '@/domain/Table/Cell';

interface LabelParams {
  rows: string[];
  columns: string[];
}

class Table<T extends Cell> extends ValueObject {
  data: T[][];
  labels?: {
    rows: string[];
    columns: string[];
  };

  constructor(data: T[][], labels?: LabelParams) {
    super();
    this.data = data;
    this.labels = labels;
  }

  getData() {
    return this.data;
  }

  getShape() {
    return [this.data.length, this.data[0].length];
  }

  getRowLabels() {
    return this.labels?.rows;
  }

  getColumnLabels() {
    return this.labels?.columns;
  }

  static makeTable<T extends Cell>(data: T[][], labels?: LabelParams) {
    validate(rules(data, labels));
    return new this(data, labels);
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
export type { LabelParams };
