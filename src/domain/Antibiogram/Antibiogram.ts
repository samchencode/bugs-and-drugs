import Entity from '@/domain/base/Entity';
import ValueObject from '@/domain/base/ValueObject';
import type SensitivityData from '@/domain/Antibiogram/SensitivityData';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue';
import type OrganismValue from '@/domain/Antibiogram/OrganismValue';
import type AntibiogramId from '@/domain/Antibiogram/AntibiogramId';

class Antibiogram extends Entity {
  organisms: OrganismValue[];
  antibiotics: AntibioticValue[];
  sensitivities: SensitivityData[];

  constructor(id: AntibiogramId, data: SensitivityData[]) {
    super(id);
    this.sensitivities = data;
    this.antibiotics = ValueObject.filterUniqueValues(
      data.map((d) => d.getAntibiotic())
    );
    this.organisms = ValueObject.filterUniqueValues(
      data.map((d) => d.getOrganism())
    );
  }

  isEmpty() {
    return this.sensitivities.length === 0;
  }

  getSensitivities() {
    return this.sensitivities;
  }

  getValues() {
    return this.sensitivities.map((s) => s.getValue());
  }
}

export default Antibiogram;
