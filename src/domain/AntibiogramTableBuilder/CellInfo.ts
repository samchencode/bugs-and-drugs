import type {
  AntibioticValue,
  OrganismValue,
  SensitivityData,
} from '@/domain/Antibiogram';

class CellInfo {
  data: SensitivityData[];
  org: OrganismValue;
  abx: AntibioticValue;

  constructor(
    org: OrganismValue,
    abx: AntibioticValue,
    data: SensitivityData[]
  ) {
    this.data = data;
    this.org = org;
    this.abx = abx;
  }
}

export default CellInfo;
