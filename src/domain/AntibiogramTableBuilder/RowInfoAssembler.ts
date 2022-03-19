import {
  OrganismValue,
  SampleInfo,
  type AntibioticValue,
  type SensitivityData,
} from '@/domain/Antibiogram';
import RowInfo from '@/domain/AntibiogramTableBuilder/RowInfo';

const SPLIT_THRESHOLD = 0.3;

type ByOrganismDatum = {
  org: OrganismValue;
  data: SensitivityData[];
  sis: SampleInfo[];
  dataBySi: [SampleInfo, SensitivityData[]][];
};

class RowInfoAssembler {
  readonly SPLIT_THRESHOLD = 0.3;
  data: SensitivityData[];
  dataByOrganism: ByOrganismDatum[];

  antibiotics: AntibioticValue[];

  constructor(
    data: SensitivityData[],
    org: OrganismValue[],
    abx: AntibioticValue[]
  ) {
    this.data = data;
    this.antibiotics = abx;
    this.dataByOrganism = org.map((o) => this.#buildDatumForOrganism(o));
  }

  assembleRows(): RowInfo[] {
    const [rows, belowThreshold] = this.#assembleAboveThresholdRows();
    return this.#addBelowThresholdRows(rows, belowThreshold);
  }

  #isAboveThreshold(nCol: number, numUniqueSis: number) {
    if (numUniqueSis < 2) return true;
    const minNCol = this.antibiotics.length;
    return nCol / minNCol > SPLIT_THRESHOLD;
  }

  #getSensitivitiyDataForOrganism(org: OrganismValue) {
    return this.data.filter((d) => d.getOrganism().is(org));
  }

  #getUniqueSisForData(data: SensitivityData[]) {
    return data
      .map((d) => d.getSampleInfo())
      .reduce<SampleInfo[]>(
        (ag, v) => (ag.find((si) => si.is(v)) ? ag : [...ag, v]),
        []
      );
  }

  #buildDatumForOrganism(org: OrganismValue): ByOrganismDatum {
    const dataForOrg = this.#getSensitivitiyDataForOrganism(org);
    const uniqueSis = this.#getUniqueSisForData(dataForOrg);
    const dataForOrgBySi = uniqueSis.map<[SampleInfo, SensitivityData[]]>(
      (si) => [si, dataForOrg.filter((d) => d.getSampleInfo().is(si))]
    );
    return { org, data: dataForOrg, sis: uniqueSis, dataBySi: dataForOrgBySi };
  }

  #findBestSiMatch(thisSi: SampleInfo, allSis: SampleInfo[]) {
    return allSis
      .map((si) => [si, si.intersect(thisSi)])
      .filter(([o]) => !o.is(thisSi))
      .reduce(([agO, agIxt], [o, ixt]) => {
        const numMatching = ixt.itemsToArray().length;
        const numInBest = agIxt.itemsToArray().length;
        return numMatching > numInBest ? [o, ixt] : [agO, agIxt];
      });
  }

  #assembleAboveThresholdRows() {
    return this.dataByOrganism.reduce<[RowInfo[], RowInfo[]]>(
      ([rows, belowThreshold], { org, dataBySi }) => {
        const allInfo = dataBySi.map(
          ([si, data]) => new RowInfo(org, si, data)
        );
        const above = allInfo.filter(({ data }) =>
          this.#isAboveThreshold(data.length, dataBySi.length)
        );
        const below = allInfo.filter(
          ({ data }) => !this.#isAboveThreshold(data.length, dataBySi.length)
        );
        return [rows.concat(above), belowThreshold.concat(below)];
      },
      [[], []]
    );
  }

  #addBelowThresholdRows(_rows: RowInfo[], _belowThreshold: RowInfo[]) {
    const rows = _rows.slice();
    const belowThreshold = _belowThreshold.slice();

    for (const { org, sis } of this.dataByOrganism) {
      const belowThresholdForOrg = belowThreshold.filter(({ organism }) =>
        org.is(organism)
      );
      for (const { info: thisSi, data } of belowThresholdForOrg) {
        // Case 3
        const [bestMatch] = this.#findBestSiMatch(thisSi, sis);

        let row: RowInfo | undefined = rows
          .filter(({ organism }) => organism.is(org))
          .find(({ data }) =>
            data.find((d) => d.getSampleInfo().is(bestMatch))
          );

        if (!row) {
          row = new RowInfo(org, new SampleInfo([]), data);
          rows.push(row);
        } else {
          row.data.push(...data);
        }
      }
    }

    return rows;
  }
}

export default RowInfoAssembler;
