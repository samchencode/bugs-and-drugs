import type { Table } from '@/domain/Table/Table';
import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';
import TableCell from '@/domain/Table/Facade/TableCell';
import TableRow from '@/domain/Table/Facade/TableRow';
import TableColumn from '@/domain/Table/Facade/TableColumn';
import TableGroup from '@/domain/Table/Facade/TableGroup';

class TableFacade {
  #table: Table<Cell>;
  #rows: TableRow[];
  #columns: TableColumn[];
  #cells: TableCell[][];
  #groups: TableGroup[];
  constructor(table: Table<Cell>) {
    this.#table = table;
    this.#groups = this.#buildGroups(table);
    this.#rows = this.#buildRows(table);
    this.#columns = this.#buildColumns(table);

    this.#cells = this.#buildCells(table);
    this.#setRowData(this.#cells);
    this.#setColumnData(this.#cells);
  }

  getCells(): TableCell[][] {
    return this.#cells;
  }

  getRows(): TableRow[] {
    return this.#rows;
  }

  getColumns(): TableColumn[] {
    return this.#columns;
  }

  getRowGroups(): TableGroup[] {
    return this.#groups;
  }

  getShape(): [number, number] {
    return this.#table.getShape();
  }

  getRowLabels(): Label[] {
    return this.#table.getRowLabels();
  }

  getColumnLabels(): Label[] {
    return this.#table.getColumnLabels();
  }

  #buildRows(table: Table<Cell>) {
    const [nRow] = table.getShape();
    const rowLabels = table.getRowLabels();
    return makeArray(nRow).map(
      (v, i) =>
        new TableRow(
          rowLabels[i],
          this.#groups.find((g) => g.includes(i))
        )
    );
  }

  #buildGroups(table: Table<Cell>) {
    const rowGroups = table.getRowGroups();
    return rowGroups.map((g) => new TableGroup(g));
  }

  #buildColumns(table: Table<Cell>) {
    const [, nCol] = table.getShape();
    const columnLabels = table.getColumnLabels();
    return makeArray(nCol).map((v, i) => new TableColumn(columnLabels[i]));
  }

  #setColumnData(cells: TableCell[][]) {
    for (const [j, column] of this.#columns.entries()) {
      const values = cells.map((c) => c[j]);
      column.setData(values);
    }
  }

  #setRowData(cells: TableCell[][]) {
    for (const [i, row] of this.#rows.entries()) {
      const values = cells[i];
      row.setData(values);
    }
  }

  #buildCells(table: Table<Cell>) {
    const result = makeMatrix(...table.getShape());
    for (const [i, row] of table.getData().entries()) {
      for (const [j, cell] of row.entries()) {
        result[i][j] = new TableCell(cell, {
          row: this.#rows[i],
          column: this.#columns[j],
          rowGroup: this.#rows[i].getGroup(),
        });
      }
    }
    return result;
  }
}

function makeArray(n: number) {
  return new Array(n).fill(undefined);
}

function makeMatrix(n: number, m: number) {
  return makeArray(n).map(() => makeArray(m));
}

export default TableFacade;
