import SensitivityData from '@/domain/SensitivityData';
import SensitivityValue from '@/domain/SensivityValue';
import Antibiotic from '@/domain/Antibiotic';
import Organism from '@/domain/Organism';

describe('Sensitivty Data', () => {
  it('should create new sensitivity data', () => {
    const data = new SensitivityData({
      value: new SensitivityValue('90'),
      antibiotic: new Antibiotic(1, 'Azithromycin'),
      organism: new Organism(1, 'Klebsiella'),
    });

    expect(data).toBeDefined();
    expect(data.value).toBeInstanceOf(SensitivityValue);
    expect(data.antibiotic).toBeInstanceOf(Antibiotic);
    expect(data.organism).toBeInstanceOf(Organism);
  });
});
