import makeTable from './makeTable';
import { Cell } from './Cell';

class Table<T> {
  data: Cell<T>[][];

  constructor(data: Cell<T>[][]) {
    this.data = data;
  }

  getData() {
    return this.data;
  }

  getShape() {
    return [this.data.length, this.data[0].length];
  }

  getColumns() {
    const columns: Cell<T>[][] = [];
    for (const i in this.data) {
      for (const j in this.data[i]) {
        if (typeof columns[j] === 'undefined') {
          columns[j] = [];
        }
        columns[j][i] = this.data[i][j];
      }
    }
    return { values: columns };
  }

  getRows() {
    return { values: this.data };
  }

  static makeTable = makeTable;
}

export default Table;
