import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import Antibiogram, {
  SensitivityValue,
  OrganismValue,
  SingleAntibioticValue as AntibioticValue,
  AntibiogramId,
  SampleInfo,
  Setting,
  Settings,
  GramValues as G,
} from '@/domain/Antibiogram';
import Place from '@/domain/Antibiogram/Place';

describe('Antibiogram', () => {
  const [data, , data2] = FakeAntibiogramRepository.data;
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
        info: new SampleInfo([Settings.INPATIENT]),
      });
      expect(antibiogram.isEmpty()).toBe(false);
      expect(antibiogram.info.hasItem(Settings.INPATIENT)).toBe(true);
      expect(antibiogram.info.getItem(Setting)?.is(Settings.INPATIENT)).toBe(
        true
      );
    });

    it('should create antibiogram with common gram value', () => {
      const antibiogram = new Antibiogram(id, data, {
        gram: G.POSITIVE,
      });

      expect(antibiogram.gram.is(G.POSITIVE)).toBe(true);
    });

    it('should create antibiogram with place', () => {
      const antibiogram = new Antibiogram(id, data, {
        place: new Place('NY', 'Memorial Sloan Kettering'),
      });

      expect(antibiogram.place.getInstitution()).toBe(
        'Memorial Sloan Kettering'
      );
      expect(antibiogram.place.getState()).toBe('NY');
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

    it('should find all unique organism-sensitivity-info pairs', () => {
      const antibiogram = new Antibiogram(new AntibiogramId('2'), data2);

      const uniqueCombinations = antibiogram.findUniqueOrganismAndSampleInfo();
      const values = uniqueCombinations.map(({ org, info }) => {
        return [
          org.getName(),
          Array.from(info.getItems().values()).map((x) => '' + x),
        ];
      });
      expect(values).toEqual(
        expect.arrayContaining([
          ['Klebsiella', ['Inpatient Setting']],
          ['Pseudomonas', ['Inpatient Setting']],
          ['Haemophilus influenza', ['Inpatient Setting']],
          ['Haemophilus influenza', ['Inpatient Setting', 'Non-Urine']],
        ])
      );
    });
  });
});
