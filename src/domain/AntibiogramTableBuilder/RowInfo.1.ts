import type {
  OrganismValue,
  SampleInfo,
  SensitivityData,
} from '@/domain/Antibiogram';

export class RowInfo {
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
