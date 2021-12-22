import Organism from '@/domain/Organism';
import Antibiotic from '@/domain/Antibiotic';
import SensitivityValue from '@/domain/SensivityValue/SensitivityValue';

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
