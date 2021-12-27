import Table from '@/domain/Table';
import type { Cell } from '@/domain/Table';
import type Antibiogram from '@/domain/Antibiogram';
import type SensitivityData from '@/domain/SensitivityData';

interface AntibiogramTableCell extends Cell<string> {}

class EmptyAntibiogramTableCell implements AntibiogramTableCell {
  value: string;
  constructor() {
    this.value = 'NA';
  }
}

class FilledAntibiogramTableCell implements AntibiogramTableCell {
  value: string;
  constructor(data: SensitivityData) {
    this.value = data.value.toString();
  }
}

function buildTableFromAntibiogram(antibiogram: Antibiogram) {
  if (antibiogram.isEmpty())
    return Table.makeTable([] as AntibiogramTableCell[][]);
  const { antibiotics, organisms } = antibiogram;
  const labels = {
    rows: organisms.map((o) => o.name),
    columns: antibiotics.map((a) => a.name),
  };
  const nRows = labels.rows.length;
  const nColumns = labels.columns.length;
  const cells: AntibiogramTableCell[][] = makeEmptyMatrix(nRows, nColumns);

  for (const d of antibiogram.getData()) {
    const row = labels.rows.indexOf(d.organism.name);
    const column = labels.columns.indexOf(d.antibiotic.name);
    cells[row][column] = new FilledAntibiogramTableCell(d);
  }

  return Table.makeTable(cells, labels);
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

export default buildTableFromAntibiogram;
