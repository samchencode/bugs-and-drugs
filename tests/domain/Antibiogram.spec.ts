import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import Antibiogram, {
  SensitivityValue,
  OrganismValue,
  AntibioticValue,
  AntibiogramId,
} from '@/domain/Antibiogram';
import SampleInfo, { Setting, Settings } from '@/domain/Antibiogram/SampleInfo';

describe('Antibiogram', () => {
  const [data] = FakeAntibiogramRepository.data;
  const id = new AntibiogramId('0');

  describe('instantiation', () => {
    it('should create empty antibiogram without data', () => {
      const antibiogram = new Antibiogram(id, []);
      expect(antibiogram.isEmpty()).toBe(true);
    });

    it('should create antibiogram with sensitivity data', () => {
      const antibiogram = new Antibiogram(id, data);
      expect(antibiogram.isEmpty()).toBe(false);
      expect(antibiogram.organisms).toBeInstanceOf(Array);
      expect(antibiogram.antibiotics).toBeInstanceOf(Array);
    });

    it('should create antibiogram with common sampleInfo', () => {
      const antibiogram = new Antibiogram(id, data, {
        info: new SampleInfo([new Setting(Settings.INPATIENT)]),
      });
      expect(antibiogram.isEmpty()).toBe(false);
      expect(antibiogram.info.hasItem(new Setting(Settings.INPATIENT))).toBe(
        true
      );
      expect(
        antibiogram.info.getItem(Setting)?.is(new Setting(Settings.INPATIENT))
      ).toBe(true);
    });
  });

  describe('behavior', () => {
    let antibiogram: Antibiogram;

    beforeEach(() => {
      antibiogram = new Antibiogram(id, data);
    });

    it('should retrieve list of all unique organisms and antibiotics', () => {
      expect(antibiogram.organisms).toEqual([
        expect.any(OrganismValue),
        expect.any(OrganismValue),
        expect.any(OrganismValue),
      ]);
      expect(antibiogram.antibiotics).toEqual([
        expect.any(AntibioticValue),
        expect.any(AntibioticValue),
      ]);

      const oNames = antibiogram.organisms.map((o) => o.getName());
      expect(oNames).toEqual(['Klebsiella', 'Pseudomonas', 'Staph aureus']);
      const aNames = antibiogram.antibiotics.map((a) => a.getName());
      expect(aNames).toEqual(['Azithromycin', 'Ampicillin']);
    });

    it('should get list of all data', () => {
      expect(antibiogram.getSensitivities()).toEqual(data);
    });

    it('should get list of all values', () => {
      expect(antibiogram.getValues()).toEqual([
        expect.any(SensitivityValue),
        expect.any(SensitivityValue),
        expect.any(SensitivityValue),
        expect.any(SensitivityValue),
        expect.any(SensitivityValue),
        expect.any(SensitivityValue),
      ]);
    });
  });
});
