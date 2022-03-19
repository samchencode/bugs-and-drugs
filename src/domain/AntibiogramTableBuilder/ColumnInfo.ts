import type { SampleInfo, AntibioticValue } from '@/domain/Antibiogram';

class ColumnInfo {
  antibiotic: AntibioticValue;
  info: SampleInfo;
  constructor(abx: AntibioticValue, commonInfo: SampleInfo) {
    this.antibiotic = abx;
    this.info = commonInfo;
  }

  describes(abx: AntibioticValue) {
    return this.antibiotic.is(abx);
  }
}

export default ColumnInfo;
