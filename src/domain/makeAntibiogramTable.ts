import { type Cell, EmptyCell, FilledCell, makeTable } from '@/domain/Table';
import type { Table } from '@/domain/Table';
import type Antibiogram from '@/domain/Antibiogram';
import type SensitivityData from '@/domain/Antibiogram/SensitivityData';

class AntibiogramTableBuilder {
  #labels?: {
    rows: string[];
    columns: string[];
  };
  #matrix: Cell[][] = [];

  makeLabels({ antibiotics, organisms }: Antibiogram) {
    this.#labels = {
      rows: organisms.map((o) => o.getName()),
      columns: antibiotics.map((a) => a.getName()),
    };
  }

  makeMatrix(abg: Antibiogram) {
    if (abg.isEmpty()) return;
    const { antibiotics, organisms } = abg;
    const nRow = organisms.length;
    const nCol = antibiotics.length;
    this.#matrix = this.#makeEmptyMatrix(nRow, nCol);
    this.#fillMatrix(abg);
  }

  build(): Table {
    if (this.#matrix.length === 0) return makeTable([]);
    return makeTable(this.#matrix, { labels: this.#labels });
  }

  reset() {
    this.#labels = undefined;
    this.#matrix = [];
  }

  #fillMatrix(abg: Antibiogram) {
    for (const d of abg.getSensitivities()) {
      const row = abg.organisms.findIndex((o) => o.is(d.getOrganism()));
      const column = abg.antibiotics.findIndex((a) => a.is(d.getAntibiotic()));
      this.#matrix[row][column] = this.#makeCell(d);
    }
  }

  #makeCell(data: SensitivityData) {
    const value = data.getValue().toString();
    return new FilledCell(value);
  }

  #makeEmptyMatrix(nRow: number, nCol: number): EmptyCell[][] {
    return new Array(nRow).fill(undefined).map(() => this.#makeEmptyRow(nCol));
  }

  #makeEmptyRow(size: number): EmptyCell[] {
    return new Array(size).fill(undefined).map(() => new EmptyCell());
  }
}

function makeAntibiogramTable(abg: Antibiogram) {
  const builder = new AntibiogramTableBuilder();
  builder.makeLabels(abg);
  builder.makeMatrix(abg);
  return builder.build();
}

export default makeAntibiogramTable;
