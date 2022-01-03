import ValueObject from '@/domain/base/ValueObject';
import validate from '@/domain/Table/Validator';
import rules from '@/domain/Table/rules';
import type Cell from '@/domain/Table/Cell';
import Label, { EmptyLabel } from '@/domain/Table/Label';

interface LabelParams {
  rows: string[];
  columns: string[];
}

interface TableLabels {
  rows: Label[];
  columns: Label[];
}

class Table<T extends Cell> extends ValueObject {
  data: T[][];
  labels: TableLabels = { rows: [], columns: [] };

  constructor(data: T[][], labels?: LabelParams) {
    super();
    this.data = data;
    if (labels) this.#setLabels(labels);
    else this.#makeEmptyLabels();
  }

  getData() {
    return this.data;
  }

  getShape() {
    return [this.data.length, this.data[0]?.length ?? 0];
  }

  getRowLabels() {
    return this.labels.rows;
  }

  getColumnLabels() {
    return this.labels.columns;
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

  #setLabels(labels: LabelParams) {
    this.labels.rows = labels.rows.map((l) => new Label(l));
    this.labels.columns = labels.columns.map((l) => new Label(l));
  }

  #makeEmptyLabels() {
    const [nRow, nCol] = this.getShape();
    this.labels.rows = new Array(nRow)
      .fill(undefined)
      .map(() => new EmptyLabel());
    this.labels.columns = new Array(nCol)
      .fill(undefined)
      .map(() => new EmptyLabel());
  }
}

export default Table;
export type { LabelParams };
