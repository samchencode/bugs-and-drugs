import type Organism from '@/domain/Organism';
import type Antibiotic from '@/domain/Antibiotic';
import type SensitivityValue from '@/domain/SensivityValue';

interface SensitivityDataParams {
  organism: Organism;
  antibiotic: Antibiotic;
  value: SensitivityValue;
}

class SensitivityData {
  organism: Organism;
  antibiotic: Antibiotic;
  value: SensitivityValue;

  constructor({ organism, antibiotic, value }: SensitivityDataParams) {
    this.organism = organism;
    this.antibiotic = antibiotic;
    this.value = value
  }
}

export default SensitivityData;
