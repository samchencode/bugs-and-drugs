import type {
  SampleInfo,
  AntibioticValue,
  SensitivityData,
} from '@/domain/Antibiogram';
import { ColumnInfo } from '@/domain/AntibiogramTableBuilder/ColumnInfo.1';

export class ColumnInfoAssembler {
  info: SampleInfo;
  data: SensitivityData[];
  antibiotics: AntibioticValue[];
  dataByAntibiotic: [AntibioticValue, SensitivityData[]][];

  constructor(
    data: SensitivityData[],
    abx: AntibioticValue[],
    info: SampleInfo
  ) {
    this.data = data;
    this.info = info;
    this.antibiotics = abx;
    this.dataByAntibiotic = abx.map<[AntibioticValue, SensitivityData[]]>(
      (abx) => [abx, data.filter((d) => d.getAntibiotic().is(abx))]
    );
  }

  assembleColumns() {
    return this.dataByAntibiotic.map(([abx, data]) => {
      const commonInfo = data
        .map((d) => d.getSampleInfo())
        .map((si) => si.subtract(this.info))
        .reduce((ag, v) => ag.intersect(v));
      return new ColumnInfo(abx, commonInfo);
    });
  }
}
