import {
  AntibioticValue,
  OrganismValue,
  SensitivityData,
  SensitivityValue,
} from '@/domain/Antibiogram';
import { IntegerNumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates';
import SampleInfo from '@/domain/Antibiogram/SampleInfo';
import Setting, { Settings } from '@/domain/Antibiogram/SampleInfo/Setting';
import Source, { Sources } from '@/domain/Antibiogram/SampleInfo/Source';
import FakeOrganismRepository from '@/infrastructure/persistence/fake/FakeOrganismRepository';

describe('Sensitivty Data', () => {
  const dummyParams = {
    value: new SensitivityValue('90'),
    antibiotic: new AntibioticValue('Azithromycin'),
    organism: new OrganismValue('Klebsiella'),
  };

  it('should create new sensitivity data', () => {
    const data = new SensitivityData(dummyParams);

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
      sampleInfo: new SampleInfo([
        new Setting(Settings.INPATIENT),
        new Source(Sources.NONURINE),
      ]),
    });

    expect(data.getSampleInfo().hasItem(new Setting(Settings.INPATIENT))).toBe(
      true
    );
    const setting = data.getSampleInfo().getItem(Setting);
    expect(setting?.is(new Setting(Settings.INPATIENT))).toBe(true);
  });

  describe('behavior', () => {
    it('should be identical to other sensitivty data with same value', () => {
      const data1 = new SensitivityData({
        value: new SensitivityValue('90'),
        antibiotic: new AntibioticValue('Azithromycin'),
        organism: new OrganismValue('Klebsiella'),
      });
      const data2 = new SensitivityData({
        value: new SensitivityValue('90'),
        antibiotic: new AntibioticValue('Azithromycin'),
        organism: new OrganismValue('Klebsiella'),
      });
      const data3 = new SensitivityData({
        value: new SensitivityValue('R'),
        antibiotic: new AntibioticValue('Azithromycin'),
        organism: new OrganismValue('Klebsiella'),
      });
      expect(data1.is(data2)).toBe(true);
      expect(data1.is(data3)).toBe(false);
    });
  });
});
