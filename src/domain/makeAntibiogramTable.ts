import Table, { Cell, Tooltip } from '@/domain/Table';
import type Antibiogram from '@/domain/Antibiogram';
import type SensitivityData from '@/domain/Antibiogram/SensitivityData';

class EmptyAntibiogramTableCell extends Cell {
  #value = 'NA';

  getValue(): string {
    return this.#value;
  }

  toString(): string {
    return this.#value;
  }

  getTooltip(): Tooltip {
    throw new Error('Method not implemented.');
  }
}

class FilledAntibiogramTableCell extends Cell {
  #value: string;

  constructor(data: SensitivityData) {
    super();
    this.#value = data.getValue().toString();
  }

  getValue(): string {
    return this.#value;
  }

  toString(): string {
    return this.#value;
  }
  getTooltip(): Tooltip {
    throw new Error('Method not implemented.');
  }
}

function makeEmptyMatrix(
  nRows: number,
  nColumns: number
): EmptyAntibiogramTableCell[][] {
  return new Array(nRows)
    .fill(undefined)
    .map(() =>
      new Array(nColumns)
        .fill(undefined)
        .map(() => new EmptyAntibiogramTableCell())
    );
}

function makeAntibiogramTable(antibiogram: Antibiogram): Table<Cell> {
  if (antibiogram.isEmpty()) return Table.makeTable([]);
  const { antibiotics, organisms } = antibiogram;
  const labels = {
    rows: organisms.map((o) => o.getName()),
    columns: antibiotics.map((a) => a.getName()),
  };
  const nRows = labels.rows.length;
  const nColumns = labels.columns.length;
  const cells: Cell[][] = makeEmptyMatrix(nRows, nColumns);

  for (const d of antibiogram.getSensitivities()) {
    const row = labels.rows.indexOf(d.getOrganism().getName());
    const column = labels.columns.indexOf(d.getAntibiotic().getName());
    cells[row][column] = new FilledAntibiogramTableCell(d);
  }

  return Table.makeTable(cells, { labels });
}

export default makeAntibiogramTable;
