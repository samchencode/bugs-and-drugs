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
      .reduce(
        (ag, data) =>
          ag.find((d) => data.describesSameOrganismAndSamples(d))
            ? ag
            : ag.concat(data),
        [] as SensitivityData[]
      )
      .map((data) => ({
        org: data.getOrganism(),
        info: data.getSampleInfo(),
        iso: data.getIsolates(),
      }));
  }
}

export default Antibiogram;
