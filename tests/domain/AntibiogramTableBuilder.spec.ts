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
        expect.arrayContaining([
          'Klebsiella (unknown)',
          'Pseudomonas (unknown)',
          'Staph aureus (unknown)',
        ])
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

    // +----------------------------------------------------------------------------------------------------+
    // |                                        Inpatient Antibiogram                                       |
    // +------------------------+---------------+---------------+-------------------+-----------------------+
    // |                        | Ampicillin PO | Ampicillin IV | Azithromycin IV/PO| Nitro IV (Urine Only) |
    // +------------------------+---------------+---------------+-------------------+-----------------------+
    // | Haemophilus (500 iso)  |            90 | NA            | 90                | 95                    |
    // | - Non-urine (450 iso)  |            92 | 96            | 86                | NA                    |
    // | Klebsiella (30 iso)    |           100 | NA            | 100               | R                     |
    // | Pseudomonas (30 iso)   |            81 | R             | R                 | 4                     |
    // +------------------------+---------------+---------------+-------------------+-----------------------+

    beforeEach(() => {
      return new FakeAntibiogramRepository().getAll().then((abgs) => {
        table = build(abgs[2]);
      });
    });

    it('should make rows for each unique organism-sampleinfo pair', () => {
      const [nRow] = table.getShape();
      expect(nRow).toBe(4);
      const rows = table.getRows().map((r) => r.getLabel() + '');
      expect(rows).toEqual(
        expect.arrayContaining([
          'Haemophilus influenza (500)',
          'Haemophilus influenza (450)',
          'Klebsiella (30)',
          'Pseudomonas (30)',
        ])
      );
    });

    it('should make columns for each unique antibiotic value', () => {
      const [, nCol] = table.getShape();
      expect(nCol).toBe(4);
      const cols = table.getColumns().map((c) => c.getLabel() + '');
      expect(cols).toEqual(
        expect.arrayContaining([
          'Ampicillin',
          'Ampicillin',
          'Azithromycin',
          'Nitrofurantoin',
        ])
      );
    });
  });
});
