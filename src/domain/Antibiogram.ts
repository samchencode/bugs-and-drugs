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
    this.sensitivities = data;
    this.antibiotics = data.map((d) => d.antibiotic).filter(uniqueEntity());
    this.organisms = data.map((d) => d.organism).filter(uniqueEntity());
  }

  isEmpty() {
    return this.sensitivities.length === 0;
  }
}

function uniqueEntity() {
  const memo = new Set();
  return (e: Entity) => (memo.has(e.id) ? false : memo.add(e.id));
}

export default Antibiogram;
