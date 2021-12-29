import {
  AntibioticValue,
  OrganismValue,
  SensitivityData,
  SensitivityValue,
} from '@/domain/Antibiogram';

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
});
