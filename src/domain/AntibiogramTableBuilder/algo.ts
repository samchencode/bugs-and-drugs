import {
  OrganismValue,
  SampleInfo,
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

function algo1(abg: Antibiogram) {
  const data = abg.getSensitivities();
  type __RowInfo = [OrganismValue, SampleInfo, SensitivityData[]];
  const rows: __RowInfo[] = [];
  const didntMeetThreshold: __RowInfo[] = [];

  const getDataForOrganism = (org: OrganismValue) =>
    data.filter((d) => d.getOrganism().is(org));
  const getUniqueSisForData = (data: SensitivityData[]) =>
    data
      .map((d) => d.getSampleInfo())
      .reduce<SampleInfo[]>(
        (ag, v) => (ag.find((si) => si.is(v)) ? ag : [...ag, v]),
        []
      );
  const dataByOrganism = abg.organisms
    .map<[OrganismValue, SensitivityData[]]>((o) => [o, getDataForOrganism(o)])
    .map<[OrganismValue, SensitivityData[], SampleInfo[]]>(([o, d]) => [
      o,
      d,
      getUniqueSisForData(d),
    ]);

  for (const [org, dataForOrganism, uniqueSis] of dataByOrganism) {
    for (const si of uniqueSis) {
      const dataForOrganismAndSi = dataForOrganism.filter((d) =>
        d.getSampleInfo().is(si)
      );

      const minNCol = abg.antibiotics.length;
      const nRowIsAboveThreshold =
        dataForOrganismAndSi.length / minNCol > SPLIT_THRESHOLD;
      // Case 1 & 2
      if (nRowIsAboveThreshold) {
        rows.push([org, si, dataForOrganismAndSi]);
      } else {
        didntMeetThreshold.push([org, si, dataForOrganismAndSi]);
      }
    }
  }

  for (const [org, , uniqueSis] of dataByOrganism) {
    for (const [orgA, thisSi, data] of didntMeetThreshold) {
      if (!org.is(orgA)) continue;

      // Case 3
      const [bestMatch] = uniqueSis
        .map((si) => [si, si.intersect(thisSi)])
        .filter(([o]) => !o.is(thisSi))
        .reduce(([agO, agIxt], [o, ixt]) => {
          const numMatching = ixt.itemsToArray().length;
          const numInBest = agIxt.itemsToArray().length;
          return numMatching > numInBest ? [o, ixt] : [agO, agIxt];
        });

      let row: __RowInfo | undefined = rows
        .filter(([, , d]) => d[0].getOrganism().is(org))
        .find(([, , d]) => d.find((d) => d.getSampleInfo().is(bestMatch)));

      if (!row) {
        row = [org, new SampleInfo([]), data];
        rows.push(row);
      } else {
        row[2].push(...data);
      }
    }

    // TODO CASE 5:
    // When we've merged all the similar misc si into a row and they still dont meet threhsold
  }

  return rows;
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
