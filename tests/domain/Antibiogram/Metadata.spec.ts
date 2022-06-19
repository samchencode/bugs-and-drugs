import { Footnotes, Metadata } from '@/domain/Antibiogram';
import ResistanceRate from '@/domain/Antibiogram/Metadata/ResistanceRate';
import ResistanceRates from '@/domain/Antibiogram/Metadata/ResistanceRates';

describe('metadata', () => {
  it('should create metadata with nullMetadataValues for undefined parameters', () => {
    const myMetaData = new Metadata({
      footnotes: new Footnotes(['myFootnote1', 'myFootnote2']),
    });
    expect(myMetaData.getRowOrder().isNull()).toBe(true);
    expect(myMetaData.getColumnOrder().isNull()).toBe(true);
    expect(myMetaData.getResistanceRates().isNull()).toBe(true);
    expect(myMetaData.getFootnotes().isNull()).toBe(false);
  });

  describe('resistance rates', () => {
    let resistanceRate1: ResistanceRate;
    let resistanceRate2: ResistanceRate;
    let resistanceRate3: ResistanceRate;

    beforeEach(() => {
      resistanceRate1 = new ResistanceRate('ESBL', '100', 2001);
      resistanceRate2 = new ResistanceRate('VRE', '<1%', 1997);
      resistanceRate3 = new ResistanceRate('MRSA', '99');
    });

    it('should create resistance rates', () => {
      const resistanceRates = new ResistanceRates([
        resistanceRate1,
        resistanceRate2,
        resistanceRate3,
      ]);
      expect(resistanceRates.isNull()).toBe(false);
      expect(
        resistanceRates
          .getResistanceRates()
          .map((resistanceRate: ResistanceRate) => {
            return resistanceRate.toString();
          })
      ).toEqual(['ESBL 100%, 2001', 'VRE <1%, 1997', 'MRSA 99%']);
    });
    it('should throw an error if the resistance rate is  not valid', () => {
      try {
        new ResistanceRate('ESBL', 'f56Lbd', 2001);
      } catch (e) {
        expect(e).toHaveProperty(
          'message',
          'Invalid resistance rate value: f56Lbd'
        );
      }
    });
  });
});
