import makeAntibiogramTable from '@/domain/makeAntibiogramTable';
import Antibiogram from '@/domain/Antibiogram';
import SensitivityData from '@/domain/SensitivityData';
import Table from '@/domain/Table';
import Organism from '@/domain/Organism';
import Antibiotic from '@/domain/Antibiotic';
import SensitivityValue from '@/domain/SensivityValue/SensitivityValue';

describe('make table using antibiogram', () => {
  it('creates table using empty antibiogram', () => {
    let abg = new Antibiogram([]);
    const table = makeAntibiogramTable(abg);
    expect(table).toBeInstanceOf(Table);
    expect(table.getData()).toEqual([]);
  });

  describe('with data', () => {
    let abg: Antibiogram;

    beforeEach(() => {
      const data = [
        new SensitivityData({
          organism: new Organism(1, 'Klebsiella'),
          antibiotic: new Antibiotic(1, 'Azithromycin'),
          value: new SensitivityValue('100'),
        }),
        new SensitivityData({
          organism: new Organism(2, 'Pseudomonas'),
          antibiotic: new Antibiotic(1, 'Azithromycin'),
          value: new SensitivityValue('R'),
        }),
        new SensitivityData({
          organism: new Organism(3, 'Staph aureus'),
          antibiotic: new Antibiotic(1, 'Azithromycin'),
          value: new SensitivityValue('90'),
        }),
      ];
      abg = new Antibiogram(data);
    });

    it('creates table using antibiogram', () => {
      const table = makeAntibiogramTable(abg);
      expect(table.getRowLabels()).toEqual(
        expect.arrayContaining(['Klebsiella', 'Pseudomonas', 'Staph aureus'])
      );
      expect(table.getColumnLabels()).toEqual(
        expect.arrayContaining(['Azithromycin'])
      );
      expect(table.getData()).toEqual(
        expect.arrayContaining([
          [{ value: '100%' }],
          [{ value: 'R' }],
          [{ value: '90%' }],
        ])
      );
    });
  });
});
