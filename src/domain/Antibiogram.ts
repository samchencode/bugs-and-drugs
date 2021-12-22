import Entity from '@/domain/Entity';
import type SensitivityData from '@/domain/SensitivityData';
import type Antibiotic from '@/domain/Antibiotic';
import type Organism from '@/domain/Organism';

class Antibiogram extends Entity {
  organisms: Organism[] = [];
  antibiotics: Antibiotic[] = [];
  sensitivities: SensitivityData[];

  constructor(data: SensitivityData[]) {
    super();
    const hasIdentical = (arr: Entity[], value: Entity) =>
      arr.find((x) => x.equals(value));

    const addIfUnique = (arr: Entity[], value: Entity) =>
      hasIdentical(arr, value) || arr.push(value);

    this.sensitivities = data;

    for (let d of data) {
      addIfUnique(this.antibiotics, d.antibiotic);
      addIfUnique(this.organisms, d.organism);
    }
  }

  isEmpty() {
    return this.sensitivities.length === 0;
  }
}

export default Antibiogram;
