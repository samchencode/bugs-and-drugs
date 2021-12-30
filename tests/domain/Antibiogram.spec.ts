import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import Antibiogram, {
  SensitivityValue,
  OrganismValue,
  AntibioticValue,
  AntibiogramId,
} from '@/domain/Antibiogram';
import type { SensitivityData } from '@/domain/Antibiogram';

describe('Antibiogram', () => {
  let data: SensitivityData[] = FakeAntibiogramRepository.data;
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
      expect(antibiogram.antibiotics).toEqual([expect.any(AntibioticValue)]);

      const oNames = antibiogram.organisms.map((o) => o.getName());
      expect(oNames).toEqual(['Klebsiella', 'Pseudomonas', 'Staph aureus']);
      const aNames = antibiogram.antibiotics.map((a) => a.getName());
      expect(aNames).toEqual(['Azithromycin']);
    });

    it('should get list of all data', () => {
      expect(antibiogram.getSensitivities()).toEqual(data);
    });

    it('should get list of all values', () => {
      expect(antibiogram.getValues()).toEqual([
        expect.any(SensitivityValue),
        expect.any(SensitivityValue),
        expect.any(SensitivityValue),
      ]);
    });
  });
});
