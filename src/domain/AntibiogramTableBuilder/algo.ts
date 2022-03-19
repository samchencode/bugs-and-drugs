import {
  OrganismValue,
  SampleInfo,
  type AntibioticValue,
  type SensitivityData,
} from '@/domain/Antibiogram';
import type Antibiogram from '@/domain/Antibiogram';

const SPLIT_THRESHOLD = 0.3;

class RowInfo {
  organism: OrganismValue;
  info: SampleInfo;
  data: SensitivityData[];
  isolates = null; // TODO

  constructor(org: OrganismValue, info: SampleInfo, data: SensitivityData[]) {
    this.organism = org;
    this.info = info;
    this.data = data;
  }
}

type ByOrganismDatum = {
  org: OrganismValue;
  data: SensitivityData[];
  sis: SampleInfo[];
  dataBySi: [SampleInfo, SensitivityData[]][];
};

class RowAssembler {
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

  assembleRows() {
    const [rows, belowThreshold] = this.dataByOrganism.reduce<
      [RowInfo[], RowInfo[]]
    >(
      ([rows, belowThreshold], { org, dataBySi }) => {
        const allRowInfo = dataBySi.map(
          ([si, data]) => new RowInfo(org, si, data)
        );
        const above = allRowInfo.filter(({ data }) =>
          this.#isAboveThreshold(data.length)
        );
        const below = allRowInfo.filter(
          ({ data }) => !this.#isAboveThreshold(data.length)
        );
        return [rows.concat(above), belowThreshold.concat(below)];
      },
      [[], []]
    );

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

  #isAboveThreshold(nCol: number) {
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
}

function algo1(abg: Antibiogram) {
  const assembler = new RowAssembler(
    abg.getSensitivities(),
    abg.organisms,
    abg.antibiotics
  );
  return assembler.assembleRows();
}

function algo2(abg: Antibiogram) {
  const abgSi = abg.info;
  const data = abg.getSensitivities();

  const results = [];

  for (const abx of abg.antibiotics) {
    const dataForAntibiotic = data.filter((d) => d.getAntibiotic().is(abx));

    const commonSi = dataForAntibiotic
      .map((d) => d.getSampleInfo())
      .map((si) => si.subtract(abgSi))
      .reduce((ag, v) => ag.intersect(v));

    if (commonSi.is(new SampleInfo([]))) results.push({ abx });
    else
      results.push({
        abx,
        commonSi,
      });
  }

  return results;
}

export default algo1;

export { algo2 };
