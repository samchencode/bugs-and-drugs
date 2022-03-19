import {
  UnknownNumberOfIsolates,
  type NumberOfIsolates,
  type OrganismValue,
  type SampleInfo,
  type SensitivityData,
} from '@/domain/Antibiogram';

class RowInfo {
  organism: OrganismValue;
  info: SampleInfo;
  data: SensitivityData[];
  isolates?: NumberOfIsolates;

  constructor(org: OrganismValue, info: SampleInfo, data: SensitivityData[]) {
    this.organism = org;
    this.info = info;
    this.data = data;
    this.isolates =
      data.find((d) => d.getSampleInfo().is(this.info))?.getIsolates() ??
      new UnknownNumberOfIsolates();
  }

  describes(org: OrganismValue, info?: SampleInfo): boolean {
    if (!info) return this.organism.is(org);
    return this.organism.is(org) && this.info.is(info);
  }
}

export default RowInfo;
