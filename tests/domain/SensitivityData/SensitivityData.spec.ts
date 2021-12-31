import {
  AntibioticValue,
  OrganismValue,
  SensitivityData,
  SensitivityValue,
} from '@/domain/Antibiogram';
import { IntegerNumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates';
import FakeOrganismRepository from '@/infrastructure/persistence/fake/FakeOrganismRepository';

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
    const [org] = FakeOrganismRepository.data;
    const data = new SensitivityData({
      value: new SensitivityValue('90'),
      antibiotic: new AntibioticValue('Azithromycin'),
      organism: new OrganismValue('Klebsiella', org),
    });
    expect(data.getOrganism().getOrganism()?.id.is(org.id)).toBe(true);
  });

  it('should detail number of isolates for organism-setting-source triplet', () => {
    const data = new SensitivityData({
      value: new SensitivityValue('90'),
      antibiotic: new AntibioticValue('AzithroMax'),
      organism: new OrganismValue('Borrelia burgdorferi'),
      isolates: new IntegerNumberOfIsolates(50),
    });

    expect(data.getIsolates().getValue()).toBe(50);
  });

  it('should default to unknown number of isolates', () => {
    const data = new SensitivityData({
      value: new SensitivityValue('90'),
      antibiotic: new AntibioticValue('Azithromycin'),
      organism: new OrganismValue('Klebsiella'),
    });

    expect(data.getIsolates().isUnknown()).toBe(true);
  });
});
