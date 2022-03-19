import {
  SensitivityData,
  UnknownNumberOfIsolates,
  type NumberOfIsolates,
  type OrganismValue,
  type SampleInfo,
} from '@/domain/Antibiogram';
import type { Range } from '@/domain/Table';

class RowInfo {
  org: OrganismValue;
  data: SensitivityData[];
  info: SampleInfo;
  iso: NumberOfIsolates;

  constructor(data: SensitivityData[], org: OrganismValue) {
    this.org = org;
    this.data = data;

    this.info = data
      .map((d) => d.getSampleInfo())
      .reduce((ag, si) => ag.intersect(si));

    const dataWithCommonDenominatorInfo = data.find((d) =>
      d.getSampleInfo().is(this.info)
    );

    this.iso =
      dataWithCommonDenominatorInfo?.getIsolates() ??
      new UnknownNumberOfIsolates();
  }

  describes(org: OrganismValue, info?: SampleInfo): boolean {
    if (!info) return this.org.is(org);
    return this.org.is(org) && this.info.is(info);
  }

  static sortRows(baseSi: SampleInfo, data: RowInfo[]) {
    const collator = Intl.Collator('en-US');
    return data
      .sort(({ info: s1 }, { info: s2 }) => {
        if (s1.is(baseSi)) return -1;
        if (s2.is(baseSi)) return 1;
        return 0;
      })
      .sort(({ org: o1 }, { org: o2 }) => {
        return collator.compare(o1.getName(), o2.getName());
      });
  }

  static findGroupBoundariesByOrganism(rows: RowInfo[]) {
    return Array.from(rows.entries())
      .filter(([i, { org }]) => i === 0 || !org.is(rows[i - 1].org))
      .map<Range>(([i], k, arr) => [i, arr[k + 1]?.[0] ?? rows.length]);
  }
}

export default RowInfo;
