import {
  SingleAntibioticValue,
  OrganismValue,
  SensitivityData,
  SensitivityValue,
  SampleInfo,
  Setting,
  Settings,
  Sources,
  IntegerNumberOfIsolates,
} from '@/domain/Antibiogram';
import FakeOrganismRepository from '@/infrastructure/persistence/fake/FakeOrganismRepository';

describe('Sensitivty Data', () => {
  const dummyParams = {
    value: new SensitivityValue('90'),
    antibiotic: new SingleAntibioticValue('Azithromycin'),
    organism: new OrganismValue('Klebsiella'),
  };

  it('should create new sensitivity data', () => {
    const data = new SensitivityData(dummyParams);

    expect(data).toBeDefined();
    const value = data.getValue();
    expect(value).toBeInstanceOf(SensitivityValue);
    const abx = data.getAntibiotic();
    expect(abx).toBeInstanceOf(SingleAntibioticValue);
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
      antibiotic: new SingleAntibioticValue('Azithromycin'),
      organism: new OrganismValue('Klebsiella', org),
    });
    expect(data.getOrganism().getOrganism()?.id.is(org.id)).toBe(true);
  });

  it('should detail number of isolates for organism-setting-source triplet', () => {
    const data = new SensitivityData({
      ...dummyParams,
      isolates: new IntegerNumberOfIsolates(50),
    });

    expect(data.getIsolates().getValue()).toBe(50);
  });

  it('should default to unknown number of isolates', () => {
    const data = new SensitivityData(dummyParams);

    expect(data.getIsolates().isUnknown()).toBe(true);
  });

  it('should store info about sources and setting that the data were collected in', () => {
    const data = new SensitivityData({
      ...dummyParams,
      sampleInfo: new SampleInfo([Settings.INPATIENT, Sources.NONURINE]),
    });

    expect(data.getSampleInfo().hasItem(Settings.INPATIENT)).toBe(true);
    const setting = data.getSampleInfo().getItem(Setting);
    expect(setting?.is(Settings.INPATIENT)).toBe(true);
  });

  describe('behavior', () => {
    it('should be identical to other sensitivty data with same value', () => {
      const data1 = new SensitivityData({
        value: new SensitivityValue('90'),
        antibiotic: new SingleAntibioticValue('Azithromycin'),
        organism: new OrganismValue('Klebsiella'),
      });
      const data2 = new SensitivityData({
        value: new SensitivityValue('90'),
        antibiotic: new SingleAntibioticValue('Azithromycin'),
        organism: new OrganismValue('Klebsiella'),
      });
      const data3 = new SensitivityData({
        value: new SensitivityValue('R'),
        antibiotic: new SingleAntibioticValue('Azithromycin'),
        organism: new OrganismValue('Klebsiella'),
      });
      expect(data1.is(data2)).toBe(true);
      expect(data1.is(data3)).toBe(false);
    });

    it('should return whether sample info and organism are the same', () => {
      const data1 = new SensitivityData({
        value: new SensitivityValue('90'),
        antibiotic: new SingleAntibioticValue('Azithromycin'),
        organism: new OrganismValue('Klebsiella'),
      });
      const data2 = new SensitivityData({
        value: new SensitivityValue('R'),
        antibiotic: new SingleAntibioticValue('Cefazolin'),
        organism: new OrganismValue('Klebsiella'),
      });
      const data3 = new SensitivityData({
        value: new SensitivityValue('30'),
        antibiotic: new SingleAntibioticValue('Cefazolin'),
        organism: new OrganismValue('Klebsiella'),
        sampleInfo: new SampleInfo([Sources.URINE]),
      });
      expect(data1.describesSameOrganismAndSamples(data2)).toBe(true);
      expect(data1.describesSameOrganismAndSamples(data3)).toBe(false);
    });
  });
});
