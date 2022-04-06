import { writable, type Writable } from 'svelte/store';
import { TableElement } from '@/infrastructure/view/templates/table/TableElement';
import type { Cell, Label, Table } from '@/domain/Table';
import { RowHeader } from '@/infrastructure/view/templates/table/RowHeader';
import type TableGroup from '@/domain/Table/Facade/TableGroup';

interface TableState {
  rowHeaders: RowHeader[];
  columnHeaders: TableElement[];
  grid: TableElement[][];
  groups: TableGroup[];
}

const { subscribe, update, set }: Writable<TableState> = writable({
  rowHeaders: [] as RowHeader[],
  columnHeaders: [] as TableElement[],
  grid: [] as TableElement[][],
  groups: [] as TableGroup[],
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

function _highlightRow(
  row: number,
  grid: TableElement[][],
  header: RowHeader[]
) {
  grid[row].forEach((cell) => {
    cell.highlight();
  });
  header[row].highlight();
  return { grid, header };
}
function _unhighlightRow(
  row: number,
  grid: TableElement[][],
  header: RowHeader[]
) {
  grid[row].forEach((cell) => {
    cell.unHighlight();
  });
  header[row].unHighlight();
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

function _highlightColumn(
  column: number,
  grid: TableElement[][],
  header: TableElement[]
) {
  grid.forEach((row) => {
    row[column].highlight();
  });
  header[column].highlight();
  return { grid, header };
}

function _unhighlightColumn(
  column: number,
  grid: TableElement[][],
  header: TableElement[]
) {
  grid.forEach((row) => {
    row[column].unHighlight();
  });
  header[column].unHighlight();
  return { grid, header };
}

const toggleHighlightRow = (i: number) => {
  update((s) => {
    s.rowHeaders[i].toggleActive();
    const { grid, header } = _toggleHighlightRow(i, s.grid, s.rowHeaders);
    return { ...s, grid, rowHeaders: header };
  });
};

const highlightRow = (i: number) => {
  update((s) => {
    s.rowHeaders[i].setActive();
    const { grid, header } = _highlightRow(i, s.grid, s.rowHeaders);
    return { ...s, grid, rowHeaders: header };
  });
};
const unhighlightRow = (i: number) => {
  update((s) => {
    s.rowHeaders[i].unsetActive();
    const { grid, header } = _unhighlightRow(i, s.grid, s.rowHeaders);
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

const highlightColumn = (j: number) => {
  update((s) => {
    s.columnHeaders[j].setActive();
    const { grid, header } = _highlightColumn(j, s.grid, s.columnHeaders);
    return { ...s, grid, columnHeaders: header };
  });
};

const unhighlightColumn = (j: number) => {
  update((s) => {
    s.columnHeaders[j].unsetActive();
    const { grid, header } = _unhighlightColumn(j, s.grid, s.columnHeaders);
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
      groups: s.groups,
    };
  });
};

const highlightCell = (i: number, j: number) => {
  update((s) => {
    let newGrid = s.grid.slice();
    let newRowHeaders = s.rowHeaders.slice();
    let newColumnHeaders = s.columnHeaders.slice();

    newGrid[i][j].setActive();

    ({ grid: newGrid, header: newRowHeaders } = _highlightRow(
      i,
      newGrid,
      newRowHeaders
    ));

    ({ grid: newGrid, header: newColumnHeaders } = _highlightColumn(
      j,
      newGrid,
      newColumnHeaders
    ));

    return {
      grid: newGrid,
      rowHeaders: newRowHeaders,
      columnHeaders: newColumnHeaders,
      groups: s.groups,
    };
  });
};

const unhighlightCell = (i: number, j: number) => {
  update((s) => {
    let newGrid = s.grid.slice();
    let newRowHeaders = s.rowHeaders.slice();
    let newColumnHeaders = s.columnHeaders.slice();

    newGrid[i][j].unsetActive();

    ({ grid: newGrid, header: newRowHeaders } = _unhighlightRow(
      i,
      newGrid,
      newRowHeaders
    ));

    ({ grid: newGrid, header: newColumnHeaders } = _unhighlightColumn(
      j,
      newGrid,
      newColumnHeaders
    ));

    return {
      grid: newGrid,
      rowHeaders: newRowHeaders,
      columnHeaders: newColumnHeaders,
      groups: s.groups,
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
  const groupArray: TableGroup[] = [];
  table.getRows().forEach((row) => {
    const group = row.getGroup();
    if (group) {
      let unique = true;
      groupArray.forEach((g) => {
        if (g == group) {
          unique = false;
        }
      });
      if (unique) groupArray.push(group);
    }
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
    groups: groupArray,
  });
};
const expandAllGroups = () => {
  update((s) => {
    s.groups.forEach((group) => group.expand());
    return s;
  });
  // update((s) => {
  //   const length = s.rowHeaders.length;
  //   console.log(i + ' : ' + length);
  //   if (i < length) {
  //     if (s.rowHeaders[i].inGroup()) {
  //       const newTable = s.rowHeaders[i].getGroup()?.expand();
  //       if (newTable != null) loadTable(newTable);
  //       i++;
  //       expandAllGroups(i);
  //       return s;
  //     } else {
  //       i++;
  //       return s;
  //     }
  //   } else return s;
  // });
};
const collapseAllGroups = () => {
  update((s) => {
    s.groups.forEach((group) => group.expand());
    return s;
  });
  // update((s) => {
  //   const length = s.rowHeaders.length;
  //   console.log(i + ' : ' + length);
  //   if (i < length) {
  //     if (s.rowHeaders[i].inGroup()) {
  //       const newTable = s.rowHeaders[i].getGroup()?.collapse();
  //       if (newTable != null) loadTable(newTable);
  //       i++;
  //       collapseAllGroups(i);
  //       return s;
  //     } else {
  //       i++;
  //       return s;
  //     }
  //   } else return s;
  // });
};
export const state = {
  subscribe,
  loadTable,
  toggleHighlightCell,
  toggleHighlightColumn,
  toggleHighlightRow,
  highlightCell,
  unhighlightCell,
  highlightColumn,
  unhighlightColumn,
  highlightRow,
  unhighlightRow,
  expandGroup,
  collapseGroup,
  expandAllGroups,
  collapseAllGroups,
};
