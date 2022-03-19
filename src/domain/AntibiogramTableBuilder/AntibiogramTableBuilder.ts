import type { Table, Cell } from '@/domain/Table';
import type Antibiogram from '@/domain/Antibiogram';
import type { SampleInfo, SensitivityData } from '@/domain/Antibiogram';
import { Label, makeTable } from '@/domain/Table';
import TableElementFactory from '@/domain/AntibiogramTableBuilder/TableElementFactory';
import RowInfo from '@/domain/AntibiogramTableBuilder/RowInfo';
import CellInfo from '@/domain/AntibiogramTableBuilder/CellInfo';
import ColumnInfo from '@/domain/AntibiogramTableBuilder/ColumnInfo';
import RowInfoAssembler from '@/domain/AntibiogramTableBuilder/RowInfoAssembler';

function makeAntibiogramTable(abg: Antibiogram) {
  const assembler = new RowInfoAssembler(
    abg.getSensitivities(),
    abg.organisms,
    abg.antibiotics
  );
  const rows = assembler.assembleRows();
}

class AntibiogramTableBuilder {
  #labels?: {
    rows: Label[];
    columns: Label[];
  };
  #matrix: Cell[][] = [];
  #factory: TableElementFactory = new TableElementFactory();
  #rows?: RowInfo[];
  #columns?: ColumnInfo[];
  #cells?: CellInfo[];

  makeLabels(abg: Antibiogram) {
    this.#labels = {
      rows: this.#makeRowLabels(this.#getRows(abg)),
      columns: this.#makeColumnLabels(this.#getColumns(abg)),
    };
  }

  makeMatrix(abg: Antibiogram) {
    if (abg.isEmpty()) return;
    const nRow = this.#getRows(abg).length;
    const nCol = this.#getColumns(abg).length;
    const emptyMatrix = this.#factory.makeEmptyMatrix(nRow, nCol);
    this.#matrix = this.#fillMatrix(abg, emptyMatrix);
  }

  build(): Table {
    if (this.#matrix.length === 0) return makeTable([]);
    return makeTable(this.#matrix, { labels: this.#labels });
  }

  reset() {
    this.#labels = undefined;
    this.#matrix = [];
    this.#rows = undefined;
    this.#cells = undefined;
    this.#columns = undefined;
  }

  #getCells(abg: Antibiogram): CellInfo[] {
    if (typeof this.#cells !== 'undefined') return this.#cells;
    const data = abg.getSensitivities();
    this.#cells = this.#getAntibioticOrganismPairs(data);

    type CellMap = { [key: string]: CellInfo[] };

    const minNRow = abg.organisms.length;
    const minNCol = abg.antibiotics.length;

    // TODO: group cells by org & abx
    const byOrg = this.#cells.reduce((ag, c) => {
      const orgName = c.org.getName();
      if (!Array.isArray(ag[orgName])) return { ...ag, [orgName]: [c] };
      ag[orgName].push(c);
      return ag;
    }, {} as CellMap);
    const byAbx = this.#cells.reduce((ag, c) => {
      const abxName = c.abx.getName();
      if (!Array.isArray(ag[abxName])) return { ...ag, [abxName]: [c] };
      ag[abxName].push(c);
      return ag;
    }, {} as CellMap);
    // TODO: find unique SI sets and count them

    const siByOrg = Object.fromEntries(
      Object.entries(byOrg).map(([k, v]) => {
        const seenSi: SampleInfo[] = [];
        const siCounts = new Map<SampleInfo, number>();
        for (const cell of v) {
          for (const thisSi of cell.data.map((d) => d.getSampleInfo())) {
            let si = seenSi.find((s) => s.is(thisSi));
            if (!si) (si = thisSi) && seenSi.push(si);
            siCounts.set(si, (siCounts.get(si) ?? 0) + 1);
          }
        }
        return [k, siCounts];
      })
    );

    // TODO: cell that contain two data >33%

    // TODO: split cells into two cells that go in diff rows
    // TODO: distribute si abg > row | column > cell

    return this.#cells;
  }

  #getRows(abg: Antibiogram): RowInfo[] {
    if (typeof this.#rows !== 'undefined') return this.#rows;
    return this.#sortRows(this.#makeRowInfo(abg));
  }

  #makeRowInfo(abg: Antibiogram) {
    type DataByOrganism = { [key: string]: SensitivityData[] };
    const dataByOrganism = abg.getSensitivities().reduce((ag, d) => {
      const orgName = d.getOrganism().getName();
      if (!Array.isArray(ag[orgName]))
        return Object.assign(ag, { [orgName]: [d] });

      ag[orgName].push(d);
      return ag;
    }, {} as DataByOrganism);

    return abg.organisms.map(
      (o) => new RowInfo(dataByOrganism[o.getName()], o)
    );
  }

  #sortRows(rows: RowInfo[]): RowInfo[] {
    return rows.sort((a, b) => {
      if (a.org.getName() < b.org.getName()) return -1;
      if (a.org.getName() > b.org.getName()) return 1;
      return 0;
    });
  }

  #getColumns(abg: Antibiogram): ColumnInfo[] {
    if (typeof this.#columns !== 'undefined') return this.#columns;
    return this.#sortColumns(this.#makeColumnInfo(abg));
  }

  #makeColumnInfo(abg: Antibiogram) {
    type DataByAntibiotic = { [key: string]: SensitivityData[] };
    const dataByAntibiotic = abg.getSensitivities().reduce((ag, d, i) => {
      const abxName = d.getAntibiotic().getName();

      if (!Array.isArray(ag[abxName]))
        return Object.assign(ag, { [abxName]: [d] });

      ag[abxName].push(d);
      return ag;
    }, {} as DataByAntibiotic);

    return abg.antibiotics.map(
      (a) => new ColumnInfo(dataByAntibiotic[a.getName()], a)
    );
  }

  #sortColumns(cols: ColumnInfo[]): ColumnInfo[] {
    return cols.sort((a, b) => {
      if (a.abx.getName() < b.abx.getName()) return -1;
      if (a.abx.getName() > b.abx.getName()) return 1;
      return 0;
    });
  }

  #makeRowLabels(rows: RowInfo[]) {
    return rows.map((r) => this.#factory.makeOrganismLabel(r));
  }

  #makeColumnLabels(cols: ColumnInfo[]) {
    return cols.map((a) => this.#factory.makeAntibioticLabel(a));
  }

  #fillMatrix(abg: Antibiogram, matrix: Cell[][]) {
    const cells = this.#getCells(abg);
    const rows = this.#getRows(abg);
    const columns = this.#getColumns(abg);
    const result = matrix.slice().map((r) => r.slice());
    for (const cell of cells) {
      const row = rows.findIndex((r) => r.describes(cell.org));
      const column = columns.findIndex((a) => a.abx.is(cell.abx));
      result[row][column] = this.#factory.makeCell(cell);
    }
    return result;
  }

  #getAntibioticOrganismPairs(data: SensitivityData[]): CellInfo[] {
    const temp = data.slice();
    const abxOrgPairedData: CellInfo[] = [];
    for (let i = 0; i < temp.length; i++) {
      const item = temp[i];
      const org = item.getOrganism();
      const abx = item.getAntibiotic();
      const matches = [];
      let j = i + 1;
      while (j < temp.length) {
        const otherItem = temp[j];
        const sameOrg = otherItem.getOrganism().is(org);
        const sameAbx = otherItem.getAntibiotic().is(abx);
        if (sameOrg && sameAbx) {
          matches.push(otherItem);
          temp.splice(j, 1);
        } else j++;
      }
      abxOrgPairedData.push(new CellInfo(org, abx, [item, ...matches]));
    }
    return abxOrgPairedData;
  }
}

export default AntibiogramTableBuilder;
