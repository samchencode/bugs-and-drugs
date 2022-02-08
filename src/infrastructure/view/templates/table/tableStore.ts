import { writable, type Writable } from 'svelte/store';
import { TableElement } from '@/infrastructure/view/templates/table/TableElement';
import type { Cell, Label, Table } from '@/domain/Table';
import { RowHeader } from '@/infrastructure/view/templates/table/RowHeader';
import type TableGroup from '@/domain/Table/Facade/TableGroup';

interface TableState {
  rowHeaders: RowHeader[];
  columnHeaders: TableElement[];
  grid: TableElement[][];
}

const { subscribe, update, set }: Writable<TableState> = writable({
  rowHeaders: [] as RowHeader[],
  columnHeaders: [] as TableElement[],
  grid: [] as TableElement[][],
});

function _toggleHighlightRow(
  row: number,
  grid: TableElement[][],
  header: RowHeader[]
) {
  grid[row].forEach((cell) => {
    cell.toggleHighlighted();
  });
  header[row].toggleHighlighted();
  return { grid, header };
}

function _toggleHighlightColumn(
  column: number,
  grid: TableElement[][],
  header: TableElement[]
) {
  grid.forEach((row) => {
    row[column].toggleHighlighted();
  });
  header[column].toggleHighlighted();
  return { grid, header };
}

const toggleHighlightRow = (i: number) => {
  update((s) => {
    s.rowHeaders[i].toggleActive();
    const { grid, header } = _toggleHighlightRow(i, s.grid, s.rowHeaders);
    return { ...s, grid, rowHeaders: header };
  });
};

const toggleHighlightColumn = (j: number) => {
  update((s) => {
    s.columnHeaders[j].toggleActive();
    const { grid, header } = _toggleHighlightColumn(j, s.grid, s.columnHeaders);
    return { ...s, grid, columnHeaders: header };
  });
};

const toggleHighlightCell = (i: number, j: number) => {
  update((s) => {
    let newGrid = s.grid.slice();
    let newRowHeaders = s.rowHeaders.slice();
    let newColumnHeaders = s.columnHeaders.slice();

    newGrid[i][j].toggleActive();

    ({ grid: newGrid, header: newRowHeaders } = _toggleHighlightRow(
      i,
      newGrid,
      newRowHeaders
    ));

    ({ grid: newGrid, header: newColumnHeaders } = _toggleHighlightColumn(
      j,
      newGrid,
      newColumnHeaders
    ));

    return {
      grid: newGrid,
      rowHeaders: newRowHeaders,
      columnHeaders: newColumnHeaders,
    };
  });
};
const expandGroup = (group: TableGroup) => {
  loadTable(group.expand());
};
const collapseGroup = (group: TableGroup) => {
  loadTable(group.collapse());
};
const loadTable = (table: Table) => {
  table.getRows().forEach((row) => {
    row.getGroup();
  });
  set({
    grid: table
      ?.getCells()
      .map((row: Cell[]) =>
        row.map((cell: Cell, index) => new TableElement(index, cell))
      ),
    rowHeaders: table
      ?.getRows()
      .map(
        (row, index) => new RowHeader(index, row.getLabel(), row.getGroup())
      ),
    columnHeaders: table
      ?.getColumnLabels()
      .map((label: Label, index) => new TableElement(index, label)),
  });
};
const expandAllGroups = (i: number) => {
  update((s) => {
    const length = s.rowHeaders.length;
    console.log(i);
    console.log(length);
    if (i < length) {
      if (s.rowHeaders[i].inGroup()) {
        const newTable = s.rowHeaders[i].getGroup()?.expand();
        if (newTable != null) loadTable(newTable);
        i++;
        expandAllGroups(i);
        return s;
      } else {
        i++;
        return s;
      }
    } else return s;
  });
};
const collapseAllGroups = (i: number) => {
  update((s) => {
    const length = s.rowHeaders.length;
    console.log(i);
    console.log(length);
    if (i < length) {
      if (s.rowHeaders[i].inGroup()) {
        const newTable = s.rowHeaders[i].getGroup()?.expand();
        if (newTable != null) loadTable(newTable);
        i++;
        expandAllGroups(i);
        return s;
      } else {
        i++;
        return s;
      }
    } else return s;
  });
};
export const state = {
  subscribe,
  loadTable,
  toggleHighlightCell,
  toggleHighlightColumn,
  toggleHighlightRow,
  expandGroup,
  collapseGroup,
  expandAllGroups,
  collapseAllGroups,
};
