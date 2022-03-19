import type { SampleInfo, AntibioticValue } from '@/domain/Antibiogram';

export class ColumnInfo {
  antibiotic: AntibioticValue;
  info?: SampleInfo;
  constructor(abx: AntibioticValue, commonInfo?: SampleInfo) {
    this.antibiotic = abx;
    this.info = commonInfo;
  }
}
