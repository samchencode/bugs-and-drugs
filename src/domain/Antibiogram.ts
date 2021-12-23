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
    this.antibiotics = filterUniqueEntity(data.map((d) => d.antibiotic));
    this.organisms = filterUniqueEntity(data.map((d) => d.organism));
  }

  isEmpty() {
    return this.sensitivities.length === 0;
  }

  getData() {
    return this.sensitivities;
  }

  getValues() {
    return this.sensitivities.map(s => s.value);
  }
}

function filterUniqueEntity<T extends Entity>(arr: T[]) {
  const memo = new Set();
  const isUnique = (e: Entity) => (memo.has(e.id) ? false : memo.add(e.id));
  return arr.filter(isUnique);
}

export default Antibiogram;
