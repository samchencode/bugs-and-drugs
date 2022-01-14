import {
  type Cell,
  Label,
  makeTable,
  type Group,
  ExpandedGroup,
} from '@/domain/Table';
import type { Table } from '@/domain/Table';
import type Antibiogram from '@/domain/Antibiogram';
import TableElementFactory from '@/domain/AntibiogramTableBuilder/TableElementFactory';
import type { AntibioticValue } from '@/domain/Antibiogram';
import RowInfo from '@/domain/AntibiogramTableBuilder/RowInfo';

type ColumnInfo = AntibioticValue;

class AntibiogramTableBuilder {
  #labels?: {
    rows: Label[];
    columns: Label[];
  };
  #matrix: Cell[][] = [];
  #factory: TableElementFactory = new TableElementFactory();
  #rows?: RowInfo[];
  #columns?: ColumnInfo[];
  #rowGroups?: Group[];

  makeRowGroups(abg: Antibiogram) {
    const rows = this.#getRows(abg);
    const ranges = RowInfo.findGroupBoundariesByOrganism(rows).filter(
      ([start, end]) => end - start > 1
    );
    this.#rowGroups = ranges.map((r) => new ExpandedGroup({ range: r }));
  }

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
    this.#matrix = this.#factory.makeEmptyMatrix(nRow, nCol);
    this.#fillMatrix(abg);
  }

  build(): Table {
    if (this.#matrix.length === 0) return makeTable([]);
    const groups = this.#rowGroups
      ? {
          rows: this.#rowGroups,
        }
      : undefined;
    return makeTable(this.#matrix, { labels: this.#labels, groups });
  }

  reset() {
    this.#labels = undefined;
    this.#matrix = [];
    this.#rows = undefined;
    this.#columns = undefined;
  }

  #getRows(abg: Antibiogram): RowInfo[] {
    if (typeof this.#rows !== 'undefined') return this.#rows;
    const rows = abg
      .findUniqueOrganismAndSampleInfo()
      .map((v) => new RowInfo(v.org, v.info, v.iso));
    const missingData = RowInfo.makeUnknowns(abg.info, abg.organisms, rows);
    this.#rows = RowInfo.sortRows(abg.info, rows.concat(missingData));
    return this.#rows;
  }

  #getColumns(abg: Antibiogram): ColumnInfo[] {
    if (typeof this.#columns !== 'undefined') return this.#columns;
    this.#columns = this.#sortColumns(abg.antibiotics);
    return this.#columns;
  }

  #sortColumns(cols: ColumnInfo[]): ColumnInfo[] {
    return cols.sort((a, b) => {
      if (a.getName() < b.getName()) return -1;
      if (a.getName() > b.getName()) return 1;
      return 0;
    });
  }

  #makeRowLabels(rows: RowInfo[]) {
    return rows.map((r) => this.#factory.makeOrganismLabel(r));
  }

  #makeColumnLabels(abx: ColumnInfo[]) {
    return abx.map((a) => this.#factory.makeAntibioticLabel(a));
  }

  #fillMatrix(abg: Antibiogram) {
    for (const d of abg.getSensitivities()) {
      const row = this.#getRows(abg).findIndex((r) =>
        r.describes(d.getOrganism(), d.getSampleInfo())
      );
      const column = this.#getColumns(abg).findIndex((a) =>
        a.is(d.getAntibiotic())
      );
      this.#matrix[row][column] = this.#factory.makeCell(d);
    }
  }
}

export default AntibiogramTableBuilder;
