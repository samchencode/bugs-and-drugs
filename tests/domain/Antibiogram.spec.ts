import Antibiogram from '@/domain/Antibiogram';
import SensitivityData from '@/domain/SensitivityData';
import Organism from '@/domain/Organism';
import Antibiotic from '@/domain/Antibiotic';
import SensitivityValue from '@/domain/SensivityValue';

describe('Antibiogram', () => {
  let data: SensitivityData[];

  beforeEach(() => {
    data = [
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
  });

  it('should create empty antibiogram without data', () => {
    const antibiogram = new Antibiogram([]);
    expect(antibiogram.isEmpty()).toBe(true);
  });

  it('should create antibiogram with sensitivity data', () => {
    const antibiogram = new Antibiogram(data);
    expect(antibiogram.isEmpty()).toBe(false);
    expect(antibiogram.organisms).toBeInstanceOf(Array);
    expect(antibiogram.antibiotics).toBeInstanceOf(Array);
    
    const orgIds = antibiogram.organisms.map(x => x.id)
    expect(orgIds).toEqual([1,2,3]);
    
    const abxIds = antibiogram.antibiotics.map(x => x.id)
    expect(abxIds).toEqual([1]);
  });

});
