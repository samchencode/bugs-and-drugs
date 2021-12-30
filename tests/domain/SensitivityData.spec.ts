import {
  AntibioticValue,
  OrganismValue,
  SensitivityData,
  SensitivityValue,
} from '@/domain/Antibiogram';
import Organism from '@/domain/Organism';

describe('Sensitivty Data', () => {
  it('should create new sensitivity data', () => {
    const data = new SensitivityData({
      value: new SensitivityValue('90'),
      antibiotic: new AntibioticValue('Azithromycin'),
      organism: new OrganismValue('Klebsiella'),
    });

    expect(data).toBeDefined();
    const value = data.getValue();
    expect(value).toBeInstanceOf(SensitivityValue);
    const abx = data.getAntibiotic();
    expect(abx).toBeInstanceOf(AntibioticValue);
    const org = data.getOrganism();
    expect(org).toBeInstanceOf(OrganismValue);

    expect(value.getValue()).toBe(90);
    expect(abx.getName()).toBe('Azithromycin');
    expect(org.getName()).toBe('Klebsiella');
  });

  it('should associate sensitivity data with Organism entity', () => {
    const org = new Organism('0', 'Klebsiella pneumoniae');
    const data = new SensitivityData({
      value: new SensitivityValue('90'),
      antibiotic: new AntibioticValue('Azithromycin'),
      organism: new OrganismValue('Klebsiella', org),
    });
    expect(data.getOrganism().getOrganism()?.id.is(org.id)).toBe(true);
  });
});
