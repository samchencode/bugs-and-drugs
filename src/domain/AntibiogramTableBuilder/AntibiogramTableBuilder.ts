import {
  type Cell,
  Label,
  makeTable,
  type Group,
  ExpandedGroup,
  type Range,
} from '@/domain/Table';
import type { Table } from '@/domain/Table';
import type Antibiogram from '@/domain/Antibiogram';
import TableElementFactory from '@/domain/AntibiogramTableBuilder/TableElementFactory';
import type {
  AntibioticValue,
  OrganismValue,
  SampleInfo,
} from '@/domain/Antibiogram';

type RowInfo = [OrganismValue, SampleInfo][];
type ColumnInfo = AntibioticValue[];

class AntibiogramTableBuilder {
  #labels?: {
    rows: Label[];
    columns: Label[];
  };
  #matrix: Cell[][] = [];
  #factory: TableElementFactory = new TableElementFactory();
  #rows?: RowInfo;
  #columns?: ColumnInfo;
  #rowGroups?: Group[];

  makeRowGroups(abg: Antibiogram) {
    const rows = this.#getRows(abg);
    const ranges = Array.from(rows.entries())
      .filter(([i, [thisOrg]]) => i === 0 || !thisOrg.is(rows[i - 1][0]))
      .map<Range>(([i], _, arr) => [i, arr[i + 1]?.[0] ?? rows.length])
      .filter(([start, end]) => end - start > 1);

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

  #getRows(abg: Antibiogram): RowInfo {
    if (typeof this.#rows !== 'undefined') return this.#rows;
    const rows = abg.findUniqueOrganismAndSampleInfo();
    const baseSampleInfo = abg.info;
    const missingData = abg.organisms
      .filter(
        (org) => !rows.find(([o, si]) => o.is(org) && si.is(baseSampleInfo))
      )
      .map<RowInfo[number]>((org) => [org, baseSampleInfo]);
    this.#rows = this.#sortRows(baseSampleInfo, rows.concat(missingData));
    return this.#rows;
  }

  #getColumns(abg: Antibiogram): ColumnInfo {
    if (typeof this.#columns !== 'undefined') return this.#columns;
    this.#columns = this.#sortColumns(abg.antibiotics);
    return this.#columns;
  }

  #sortColumns(abx: ColumnInfo): ColumnInfo {
    return abx.sort((a, b) => {
      if (a.getName() < b.getName()) return -1;
      if (a.getName() > b.getName()) return 1;
      return 0;
    });
  }

  #sortRows(baseSi: SampleInfo, data: RowInfo) {
    return data
      .sort(([, s1], [, s2]) => {
        if (s1.is(baseSi)) return -1;
        if (s2.is(baseSi)) return 1;
        return 0;
      })
      .sort(([o1], [o2]) => {
        if (o1.getName() < o2.getName()) return -1;
        if (o1.getName() > o2.getName()) return 1;
        return 0;
      });
  }

  #makeRowLabels(rows: RowInfo) {
    return rows.map(([o, si]) => this.#factory.makeOrganismLabel(o, si));
  }

  #makeColumnLabels(abx: ColumnInfo) {
    return abx.map((a) => this.#factory.makeAntibioticLabel(a));
  }

  #fillMatrix(abg: Antibiogram) {
    for (const d of abg.getSensitivities()) {
      const row = this.#getRows(abg).findIndex(
        ([o, si]) => o.is(d.getOrganism()) && si.is(d.getSampleInfo())
      );
      const column = this.#getColumns(abg).findIndex((a) =>
        a.is(d.getAntibiotic())
      );
      this.#matrix[row][column] = this.#factory.makeCell(d);
    }
  }
}

export default AntibiogramTableBuilder;
