import Entity from '@/domain/base/Entity';
import ValueObject from '@/domain/base/ValueObject';
import type SensitivityData from '@/domain/Antibiogram/SensitivityData';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue';
import type OrganismValue from '@/domain/Antibiogram/OrganismValue';
import type AntibiogramId from '@/domain/Antibiogram/AntibiogramId';
import SampleInfo from '@/domain/Antibiogram/SampleInfo';

interface AntibiogramParams {
  info: SampleInfo;
}

class Antibiogram extends Entity {
  organisms: OrganismValue[];
  antibiotics: AntibioticValue[];
  sensitivities: SensitivityData[];
  info: SampleInfo;

  constructor(
    id: AntibiogramId,
    data: SensitivityData[],
    params?: AntibiogramParams
  ) {
    super(id);
    this.sensitivities = data;
    this.antibiotics = ValueObject.filterUniqueValues(
      data.map((d) => d.getAntibiotic())
    );
    this.organisms = ValueObject.filterUniqueValues(
      data.map((d) => d.getOrganism())
    );
    this.info = params?.info ?? new SampleInfo([]);
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

  findUniqueOrganismAndSampleInfo() {
    return this.sensitivities
      .map<[OrganismValue, SampleInfo][]>((d) => [
        [d.getOrganism(), d.getSampleInfo()],
      ])
      .reduce((ag, [d]) =>
        ag.find(([o, i]) => d[0].is(o) && d[1].is(i)) ? ag : ag.concat([d])
      );
  }
}

export default Antibiogram;
