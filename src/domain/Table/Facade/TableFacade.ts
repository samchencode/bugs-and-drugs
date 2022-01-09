import type { Table } from '@/domain/Table/Table';
import type Cell from '@/domain/Table/Cell';
import type Label from '@/domain/Table/Label';
import TableCell from '@/domain/Table/Facade/TableCell';
import TableRow from '@/domain/Table/Facade/TableRow';
import TableColumn from '@/domain/Table/Facade/TableColumn';
import TableGroup from '@/domain/Table/Facade/TableGroup';
import type { TableParams } from '@/domain/Table/TableParams';
import {
  CollapsedGroup,
  ExpandedGroup,
  type Group,
  type Range,
} from '@/domain/Table/Group';

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

  #collapseRowGroup(group: Group) {
    const rowGroups = this.#table.getRowGroups();
    const rowGroupIndex = rowGroups.findIndex((g) => g.is(group));
    const newRowGroup = rowGroups[rowGroupIndex].collapse();
    const newRowGroups = rowGroups.slice();
    newRowGroups.splice(rowGroupIndex, 1, newRowGroup);

    const newParams = {
      groups: {
        rows: newRowGroups,
      },
    };
    console.log(1, newRowGroups);
    return this.#clone(newParams);
  }

  #expandRowGroup(group: Group) {
    const rowGroups = this.#table.getRowGroups();
    console.log(22, rowGroups);
    const rowGroupIndex = rowGroups.findIndex((g) => g.is(group));
    const rowGroup = rowGroups[rowGroupIndex];
    const oldRange = rowGroup.getRange();
    const oldRangeLength = rowGroup.getRangeLength();
    const newRowGroup = rowGroups[rowGroupIndex].expand();
    const newRowGroups = rowGroups.slice();
    newRowGroups.splice(rowGroupIndex, 1, newRowGroup);

    const addToRange = (r: Range, v: number): [number, number] => [
      r[0] + v,
      r[1] + v,
    ];
    for (const [i, group] of rowGroups.entries()) {
      const isAffected = group.getRange()[0] >= oldRange[1];
      console.log(222, group.getRange(), oldRange, isAffected);
      if (!isAffected) continue;
      const params = {
        range: addToRange(group.getRange(), oldRangeLength),
        expandedRange: addToRange(group.getExpandedRange(), oldRangeLength),
      };
      newRowGroups[i] = group.isCollapsed()
        ? new CollapsedGroup(params)
        : new ExpandedGroup(params);
    }

    const newParams = {
      groups: {
        rows: newRowGroups,
      },
    };
    console.log(2, newRowGroups);
    return this.#clone(newParams);
  }

  #clone(params: Partial<TableParams>): TableFacade {
    const newInnerTable = this.#table.clone(params);
    return new TableFacade(newInnerTable);
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
    return rowGroups.map(
      (g) =>
        new TableGroup(g, {
          handleCollapse: (group) =>
            group.isCollapsed() ? this : this.#collapseRowGroup(group),
          handleExpand: (group) =>
            group.isCollapsed() ? this.#expandRowGroup(group) : this,
        })
    );
  }

  #buildColumns(table: Table<Cell>) {
    const [, nCol] = table.getShape();
    const columnLabels = table.getColumnLabels();
    return makeArray(nCol).map((v, i) => new TableColumn(columnLabels[i]));
  }

  #setColumnData(cells: TableCell[][]) {
    for (const [j, column] of this.#columns.entries()) {
      const values = cells.map((c) => c[j]);
      column.setCells(values);
    }
  }

  #setRowData(cells: TableCell[][]) {
    for (const [i, row] of this.#rows.entries()) {
      const values = cells[i];
      row.setCells(values);
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
