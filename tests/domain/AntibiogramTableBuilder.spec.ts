import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import build from '@/domain/AntibiogramTableBuilder';
import Antibiogram, { AntibiogramId } from '@/domain/Antibiogram';
import type { Table } from '@/domain/Table';

describe('make table using antibiogram', () => {
  describe('empty', () => {
    it('creates table using empty antibiogram', () => {
      const abg = new Antibiogram(new AntibiogramId('0'), []);
      const table = build(abg);
      expect(table.getCells()).toEqual([]);
    });
  });

  describe('with data', () => {
    let abg1: Antibiogram;
    let abg2: Antibiogram;

    beforeEach(() => {
      return new FakeAntibiogramRepository().getAll().then(([res1, , res2]) => {
        abg1 = res1;
        abg2 = res2;
      });
    });

    it('creates table using antibiogram', () => {
      const table = build(abg1);
      const rLabels = table.getRowLabels();
      const cLabels = table.getColumnLabels();
      expect(rLabels.map((x) => x.toString())).toEqual(
        expect.arrayContaining(['Klebsiella', 'Pseudomonas', 'Staph aureus'])
      );
      expect(cLabels.map((x) => x.toString())).toEqual(
        expect.arrayContaining(['Azithromycin', 'Ampicillin'])
      );

      const data = table.getCells();
      expect(data).toEqual(expect.arrayContaining([expect.any(Array)]));
      expect(data.length).toBe(3);

      expect(table.getShape()).toEqual([3, 2]);
    });

    it('creates table using antibiogram with sample info', () => {
      const table = build(abg2);
      expect(table.getCells()).toEqual(
        expect.arrayContaining([expect.any(Array)])
      );
    });
  });

  describe('behavior', () => {
    let table: Table;

    beforeEach(() => {
      return new FakeAntibiogramRepository().getAll().then((abgs) => {
        table = build(abgs[2]);
      });
    });

    it.todo('should make rows for each unique organism-sampleinfo pair');
    it.todo('should make columns for each unique antibiotic value');
  });
});
