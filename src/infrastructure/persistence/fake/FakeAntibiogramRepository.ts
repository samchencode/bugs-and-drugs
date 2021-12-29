import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import Antibiogram, {
  OrganismValue,
  AntibioticValue,
  SensitivityData,
  SensitivityValue,
} from '@/domain/Antibiogram';

const data: SensitivityData[] = [
  new SensitivityData({
    organism: new OrganismValue('Klebsiella'),
    antibiotic: new AntibioticValue('Azithromycin'),
    value: new SensitivityValue('100'),
  }),
  new SensitivityData({
    organism: new OrganismValue('Pseudomonas'),
    antibiotic: new AntibioticValue('Azithromycin'),
    value: new SensitivityValue('R'),
  }),
  new SensitivityData({
    organism: new OrganismValue('Staph aureus'),
    antibiotic: new AntibioticValue('Azithromycin'),
    value: new SensitivityValue('90'),
  }),
];

class FakeAntibiogramRepository implements AntibiogramRepository {
  async getAll(): Promise<Antibiogram[]> {
    return [new Antibiogram(data)];
  }

  static data = data;
}

export default FakeAntibiogramRepository;
