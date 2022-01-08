import Label, { EmptyLabel } from '@/domain/Table/Label';

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

  constructor(rows: string[], columns: string[]) {
    super();
    this.rows = rows.map((l) => new Label(l));
    this.columns = columns.map((l) => new Label(l));
  }
}

class EmptyTableLabels extends TableLabels {
  protected rows: Label[];
  protected columns: Label[];

  constructor(nRow: number, nCol: number) {
    super();
    this.rows = new Array(nRow).fill(undefined).map(() => new EmptyLabel());
    this.columns = new Array(nCol).fill(undefined).map(() => new EmptyLabel());
  }
}

export default TableLabels;
export { FilledTableLabels, EmptyTableLabels };
