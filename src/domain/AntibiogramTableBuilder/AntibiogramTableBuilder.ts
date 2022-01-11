import { type Cell, Label, makeTable } from '@/domain/Table';
import type { Table } from '@/domain/Table';
import type Antibiogram from '@/domain/Antibiogram';
import TableElementFactory from '@/domain/AntibiogramTableBuilder/TableElementFactory';

class AntibiogramTableBuilder {
  #labels?: {
    rows: Label[];
    columns: Label[];
  };
  #matrix: Cell[][] = [];
  #factory: TableElementFactory;

  constructor() {
    this.#factory = new TableElementFactory();
  }

  makeLabels({ antibiotics, organisms }: Antibiogram) {
    this.#labels = {
      rows: organisms.map((o) => this.#factory.makeOrganismLabel(o)),
      columns: antibiotics.map((a) => this.#factory.makeAntibioticLabel(a)),
    };
  }

  makeMatrix(abg: Antibiogram) {
    if (abg.isEmpty()) return;
    const { antibiotics, organisms } = abg;
    const nRow = organisms.length;
    const nCol = antibiotics.length;
    this.#matrix = this.#factory.makeEmptyMatrix(nRow, nCol);
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
      this.#matrix[row][column] = this.#factory.makeCell(d);
    }
  }
}

export default AntibiogramTableBuilder;