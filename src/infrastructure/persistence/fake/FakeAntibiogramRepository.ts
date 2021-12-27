import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import Antibiogram from '@/domain/Antibiogram';
import SensitivityData from '@/domain/SensitivityData';
import Organism from '@/domain/Organism';
import Antibiotic from '@/domain/Antibiotic';
import SensitivityValue from '@/domain/SensivityValue/SensitivityValue';

const data: SensitivityData[] = [
  new SensitivityData({
    organism: new Organism(1, 'Klebsiella'),
    antibiotic: new Antibiotic(1, 'Azithromycin'),
    value: new SensitivityValue('100'),
  }),
  new SensitivityData({
    organism: new Organism(2, 'Pseudomonas'),
    antibiotic: new Antibiotic(1, 'Azithromycin'),
    value: new SensitivityValue('R'),
  }),
  new SensitivityData({
    organism: new Organism(3, 'Staph aureus'),
    antibiotic: new Antibiotic(1, 'Azithromycin'),
    value: new SensitivityValue('90'),
  }),
];

class FakeAntibiogramRepository implements AntibiogramRepository {
  getAll(): Antibiogram[] {
    return [new Antibiogram(data)];
  }
}

export default FakeAntibiogramRepository;
