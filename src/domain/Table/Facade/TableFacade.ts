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
import Labeled from '@/domain/Table/TableDecorator/Labeled/Labeled';
import { Ordered } from '@/domain/Table/TableDecorator';

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
    return this.#groups.sort((g1, g2) => g1.getRange()[0] - g2.getRange()[0]);
  }

  getRowGroupByRange(r: Range) {
    return this.#groups.find((g) => g.hasRange(r));
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

  getBase() {
    return this.#table;
  }

  merge(
    table: TableFacade,
    theirSubheader?: string,
    ourSubheader?: string,
    params?: Partial<TableParams>
  ): TableFacade {
    let theirTable = table.getBase();
    if (theirSubheader) theirTable = new Labeled(theirTable, theirSubheader);

    let ourTable = this.#table;
    if (ourSubheader) ourTable = new Labeled(ourTable, ourSubheader);

    let newTable = ourTable.merge(theirTable);
    if (params?.order) newTable = new Ordered(newTable, params.order);

    return new TableFacade(newTable);
  }

  #collapseRowGroup(old: Group) {
    const rowGroups = this.#table.getRowGroups();
    const newGroups = rowGroups.filter((g) => !g.is(old));

    return this.#clone({
      groups: {
        rows: [...newGroups, old.collapse()],
      },
    });
  }

  #expandRowGroup(old: Group) {
    const otherGroups = this.#table.getRowGroups().filter((g) => !g.is(old));
    const newGroups = [
      ...otherGroups.filter((g) => !groupComesAfter(g, old)),
      old.expand(),
    ];

    for (const g of otherGroups.filter((g) => groupComesAfter(g, old))) {
      const Group = g.isCollapsed() ? CollapsedGroup : ExpandedGroup;
      newGroups.push(
        new Group({
          range: addToRange(g.getRange(), old.getRangeLength()),
          expandedRange: addToRange(g.getExpandedRange(), old.getRangeLength()),
        })
      );
    }

    return this.#clone({
      groups: {
        rows: newGroups,
      },
    });
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

function addToRange(r: Range, v: number): [number, number] {
  return [r[0] + v, r[1] + v];
}

function groupComesAfter(g1: Group, g2: Group) {
  const r1 = g1.getRange();
  const r2 = g2.getRange();
  return r1[0] >= r2[1];
}

export default TableFacade;
