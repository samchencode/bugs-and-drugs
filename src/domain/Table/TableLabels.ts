import Label from '@/domain/Table/Label';

abstract class TableLabels {
  protected abstract rows: Label[];
  protected abstract columns: Label[];

  getRowLabels() {
    return this.rows;
  }

  getColumnLabels() {
    return this.columns;
  }
}

class FilledTableLabels extends TableLabels {
  protected rows: Label[];
  protected columns: Label[];

  constructor(rows: Label[], columns: Label[]) {
    super();
    this.rows = rows;
    this.columns = columns;
  }
}

class EmptyTableLabels extends TableLabels {
  protected rows: Label[];
  protected columns: Label[];

  constructor(nRow: number, nCol: number) {
    super();
    this.rows = new Array(nRow).fill(undefined).map(() => new Label());
    this.columns = new Array(nCol).fill(undefined).map(() => new Label());
  }
}

export default TableLabels;
export { FilledTableLabels, EmptyTableLabels };
