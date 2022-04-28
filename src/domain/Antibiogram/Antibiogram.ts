import Entity from '@/domain/base/Entity';
import ValueObject from '@/domain/base/ValueObject';
import type SensitivityData from '@/domain/Antibiogram/SensitivityData';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue';
import type OrganismValue from '@/domain/Antibiogram/OrganismValue';
import type AntibiogramId from '@/domain/Antibiogram/AntibiogramId';
import { type GramValue, GramValues } from '@/domain/Antibiogram/GramValue';
import SampleInfo from '@/domain/Antibiogram/SampleInfo';
import {
  type default as Place,
  UnknownPlace,
} from '@/domain/Antibiogram/Place';
import {
  type default as Interval,
  DefaultInterval,
} from '@/domain/Antibiogram/Interval';
import Metadata from '@/domain/Antibiogram/Metadata';

interface AntibiogramParams {
  info: SampleInfo;
  gram: GramValue;
  place: Place;
  interval: Interval;
  metadata: Metadata;
}

class Antibiogram extends Entity {
  organisms: OrganismValue[];
  antibiotics: AntibioticValue[];
  sensitivities: SensitivityData[];
  info: SampleInfo;
  gram: GramValue;
  place: Place;
  interval: Interval;
  metadata: Metadata;

  constructor(
    id: AntibiogramId,
    data: SensitivityData[],
    params?: Partial<AntibiogramParams>
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
    this.gram = params?.gram ?? GramValues.UNSPECIFIED;
    this.place = params?.place ?? new UnknownPlace();
    this.interval = params?.interval ?? new DefaultInterval();
    this.metadata = params?.metadata ?? new Metadata([]);
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
