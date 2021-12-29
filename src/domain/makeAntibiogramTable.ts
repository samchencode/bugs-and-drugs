import Table from '@/domain/Table';
import type { Cell } from '@/domain/Table';
import type Antibiogram from '@/domain/Antibiogram';
import type SensitivityData from '@/domain/Antibiogram/SensitivityData';

interface AntibiogramTableCell extends Cell<string> {}
interface AntibiogramTable extends Table<string> {}

class EmptyAntibiogramTableCell implements AntibiogramTableCell {
  #value: string;

  constructor() {
    this.#value = 'NA';
  }

  getValue(): string {
    return this.#value;
  }
}

class FilledAntibiogramTableCell implements AntibiogramTableCell {
  #value: string;

  constructor(data: SensitivityData) {
    this.#value = data.getValue().toString();
  }

  getValue(): string {
    return this.#value;
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

function makeAntibiogramTable(antibiogram: Antibiogram): AntibiogramTable {
  if (antibiogram.isEmpty()) return Table.makeTable([]);
  const { antibiotics, organisms } = antibiogram;
  const labels = {
    rows: organisms.map((o) => o.getName()),
    columns: antibiotics.map((a) => a.getName()),
  };
  const nRows = labels.rows.length;
  const nColumns = labels.columns.length;
  const cells: AntibiogramTableCell[][] = makeEmptyMatrix(nRows, nColumns);

  for (const d of antibiogram.getSensitivities()) {
    const row = labels.rows.indexOf(d.getOrganism().getName());
    const column = labels.columns.indexOf(d.getAntibiotic().getName());
    cells[row][column] = new FilledAntibiogramTableCell(d);
  }

  return Table.makeTable(cells, labels);
}

export default makeAntibiogramTable;
export type { AntibiogramTable, AntibiogramTableCell };
