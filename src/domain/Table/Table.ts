import validate from '@/domain/Table/Validator';
import rules from '@/domain/Table/rules';
import type { Cell } from '@/domain/Table/Cell';

interface LabelParams {
  rows: string[];
  columns: string[];
}

class Table<T> {
  data: Cell<T>[][];
  labels?: {
    rows: string[];
    columns: string[];
  };

  constructor(data: Cell<T>[][], labels?: LabelParams) {
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

  static makeTable<T>(data: Cell<T>[][], labels?: LabelParams) {
    validate(rules(data, labels));
    return new this(data, labels);
  }
}

export default Table;
export type { LabelParams };
