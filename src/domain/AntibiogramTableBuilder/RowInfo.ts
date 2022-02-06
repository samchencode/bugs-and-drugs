import {
  UnknownNumberOfIsolates,
  type NumberOfIsolates,
  type OrganismValue,
  type SampleInfo,
} from '@/domain/Antibiogram';
import type { Range } from '@/domain/Table';

class RowInfo {
  org: OrganismValue;
  info: SampleInfo;
  iso: NumberOfIsolates;

  constructor(org: OrganismValue, info: SampleInfo, iso?: NumberOfIsolates) {
    this.org = org;
    this.info = info;
    this.iso = iso ?? new UnknownNumberOfIsolates();
  }

  describes(org: OrganismValue, info: SampleInfo): boolean {
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

  static makeUnknowns(
    baseInfo: SampleInfo,
    orgs: OrganismValue[],
    rows: RowInfo[]
  ) {
    return orgs
      .filter((o) => !rows.find((r) => r.describes(o, baseInfo)))
      .map<RowInfo>((org) => new RowInfo(org, baseInfo));
  }

  static findGroupBoundariesByOrganism(rows: RowInfo[]) {
    return Array.from(rows.entries())
      .filter(([i, { org }]) => i === 0 || !org.is(rows[i - 1].org))
      .map<Range>(([i], k, arr) => [i, arr[k + 1]?.[0] ?? rows.length]);
  }
}

export default RowInfo;
