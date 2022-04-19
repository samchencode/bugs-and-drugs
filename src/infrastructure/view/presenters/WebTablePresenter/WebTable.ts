import type { Table } from '@/domain/Table';
import WebRowHeader from '@/infrastructure/view/presenters/WebTablePresenter/WebRowHeader';
import WebTableElement from '@/infrastructure/view/presenters/WebTablePresenter/WebTableElement';

class WebTable {
  grid: WebTableElement[][];
  rowHeaders: WebRowHeader[];
  columnHeaders: WebTableElement[];

  constructor(table: Table) {
    this.grid = table
      .getCells()
      .map((r) => r.map((c, i) => new WebTableElement(i, c)));
    this.rowHeaders = table
      .getRows()
      .map((r, i) => new WebRowHeader(i, r.getLabel(), r.getGroup()));
    this.columnHeaders = table
      .getColumnLabels()
      .map((l, i) => new WebTableElement(i, l));
  }

  highlightColumn(i: number) {
    this.columnHeaders[i].setActive();
    this.#highlightColumn(i);
  }

  #highlightColumn(i: number) {
    this.grid.forEach((row) => {
      row[i].highlight();
    });
    this.columnHeaders[i].highlight();
  }

  unhighlightColumn(i: number) {
    this.columnHeaders[i].unsetActive();
    this.#unhighlightColumn(i);
  }

  #unhighlightColumn(i: number) {
    this.grid.forEach((row) => {
      row[i].unHighlight();
    });
    this.columnHeaders[i].unHighlight();
  }

  highlightCell(i: number, j: number) {
    this.grid[i][j].setActive();
    this.#highlightRow(i);
    this.#highlightColumn(j);
  }

  unhighlightCell(i: number, j: number) {
    this.grid[i][j].unsetActive();
    this.#unhighlightRow(i);
    this.#unhighlightColumn(j);
  }

  highlightRow(i: number) {
    this.rowHeaders[i].setActive();
    this.#highlightRow(i);
  }

  #highlightRow(i: number) {
    this.grid[i].forEach((cell) => {
      cell.highlight();
    });
    this.rowHeaders[i].highlight();
  }

  unhighlightRow(i: number) {
    this.rowHeaders[i].unsetActive();
    this.#unhighlightRow(i);
  }

  #unhighlightRow(i: number) {
    this.grid[i].forEach((cell) => {
      cell.unHighlight();
    });
    this.rowHeaders[i].unHighlight();
  }
}

export default WebTable;
