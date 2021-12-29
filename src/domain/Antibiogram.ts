import Entity from '@/domain/Entity';
import type SensitivityData from '@/domain/SensitivityData';
import type Antibiotic from '@/domain/Antibiotic';
import type Organism from '@/domain/Organism';

class Antibiogram extends Entity {
  organisms: Organism[];
  antibiotics: Antibiotic[];
  sensitivities: SensitivityData[];

  constructor(data: SensitivityData[]) {
    super();
    this.sensitivities = data;
    this.antibiotics = Entity.filterUniqueEntity(data.map((d) => d.antibiotic));
    this.organisms = Entity.filterUniqueEntity(data.map((d) => d.organism));
  }

  isEmpty() {
    return this.sensitivities.length === 0;
  }

  getSensitivities() {
    return this.sensitivities;
  }

  getValues() {
    return this.sensitivities.map((s) => s.value);
  }
}

export default Antibiogram;
