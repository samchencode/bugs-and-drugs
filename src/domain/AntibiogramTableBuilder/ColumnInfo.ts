import type {
  AntibioticValue,
  SampleInfo,
  SensitivityData,
} from '@/domain/Antibiogram';

class ColumnInfo {
  abx: AntibioticValue;
  info: SampleInfo;

  constructor(data: SensitivityData[], abx: AntibioticValue) {
    this.abx = abx;

    this.info = data
      .map((d) => d.getSampleInfo())
      .reduce((ag, si) => ag.intersect(si));
  }
}

export default ColumnInfo;
