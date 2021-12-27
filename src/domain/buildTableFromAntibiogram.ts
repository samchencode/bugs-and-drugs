import makeTable from './Table/makeTable';
import type Antibiogram from '@/domain/Antibiogram';
import type { Cell } from './Table/Cell';
import type SensitivityData from './SensitivityData';

interface AntibiogramTableCell extends Cell<string> {
  value: string;
}

class EmptyAntibiogramTableCell implements AntibiogramTableCell {
  constructor() {
    this.value = 'NA';
  }
  value: string;
}

class FilledAntibiogramTableCell implements AntibiogramTableCell {
  constructor(data: SensitivityData) {
    this.value = data.value.toString();
  }
  value: string;
}

function buildTableFromAntibiogram(antibiogram: Antibiogram) {
  if(antibiogram.isEmpty()) return makeTable([]);
  const { antibiotics, organisms } = antibiogram;
  const labels = {
    rows: organisms.map((o) => o.name),
    columns: antibiotics.map((a) => a.name),
  };
  const nRows = labels.rows.length;
  const nColumns = labels.columns.length;
  let cells: AntibiogramTableCell[][] = makeEmptyMatrix(nRows, nColumns);

  for (const d of antibiogram.getData()) {
    const row = labels.rows.indexOf(d.organism.name);
    const column = labels.columns.indexOf(d.antibiotic.name);
    cells[row][column] = new FilledAntibiogramTableCell(d);
  }

  return makeTable(cells, labels);
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