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
  Interval,
  Metadata,
  Footnotes,
} from '@/domain/Antibiogram';
import Place from '@/domain/Antibiogram/Place';
import ResistanceRates from '@/domain/Antibiogram/Metadata/ResistanceRates';
import ResistanceRate from '@/domain/Antibiogram/Metadata/ResistanceRate';

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

    it('should create antibiogram with a time-range', () => {
      const antibiogram = new Antibiogram(id, data, {
        interval: new Interval(new Date(2020, 0), new Date(2021, 0)),
      });

      const publishedAt: Date = antibiogram.interval.getPublishedDate();
      const expiresAt = antibiogram.interval.getExpiryDate();

      expect(publishedAt.getFullYear()).toBe(2020);
      expect(expiresAt.getFullYear()).toBe(2021);
    });

    it('should create antibiogram with metadata', () => {
      const antibiogram = new Antibiogram(id, data, {
        metadata: new Metadata({ footnotes: new Footnotes(['my footnote']) }),
      });
      const result = antibiogram.metadata.getFootnotes()?.getValue();
      expect(result).toEqual(['my footnote']);
    });

    it('should create antibiogram with resistance rates', () => {
      const myResistanceRate = new ResistanceRate('ESBL', '56', 2001);
      const antibiogram = new Antibiogram(id, data, {
        metadata: new Metadata({
          'resistance-rates': new ResistanceRates([myResistanceRate]),
        }),
      });
      expect(
        antibiogram.metadata.getArrayOfResistanceRates()?.toString()
      ).toEqual('ESBL 56%, 2001');
    });
    it('should throw error if the resistance rate is  not valid', () => {
      try {
        const r = new ResistanceRate('ESBL', 'f56Lbd', 2001);
      } catch (e) {
        expect(e).toHaveProperty(
          'message',
          'Invalid resistance rate value: f56Lbd'
        );
      }
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
