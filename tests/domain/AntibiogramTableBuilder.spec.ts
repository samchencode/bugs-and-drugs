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

    // +-----------------------------------------------------------------------------+
    // |                            Inpatient Antibiogram                            |
    // +------------------------+---------------+---------------+--------------------+
    // |                        | Ampicillin PO | Ampicillin IV | Azithromycin IV/PO |
    // +------------------------+---------------+---------------+--------------------+
    // | Klebsiella (30 iso)    |           100 | NA            | 100                |
    // | Pseudomonas (30 iso)   |            81 | R             | R                  |
    // | Staph aureus (500 iso) |            90 | NA            | 90                 |
    // | - Non-urine (450 iso)  |            92 | 96            | 86                 |
    // +------------------------+---------------+---------------+--------------------+

    beforeEach(() => {
      return new FakeAntibiogramRepository().getAll().then((abgs) => {
        table = build(abgs[2]);
      });
    });

    it('should make rows for each unique organism-sampleinfo pair', () => {
      const [nRow] = table.getShape();
      expect(nRow).toBe(4);
      const rows = table.getRows();
      expect(rows[0].getLabel().toString()).toMatch('Klebsiella');
      expect(rows[1].getLabel().toString()).toMatch('Pseudomonas');
      expect(rows[2].getLabel().toString()).toMatch('Staph aureus');
      expect(rows[3].getLabel().toString()).toMatch('Staph aureus');
    });

    it('should make columns for each unique antibiotic value', () => {
      const [, nCol] = table.getShape();
      expect(nCol).toBe(3);
      const cols = table.getColumns();
      expect(cols[0].getLabel().toString()).toMatch('Ampicillin');
      expect(cols[1].getLabel().toString()).toMatch('Ampicillin');
      expect(cols[2].getLabel().toString()).toMatch('Azithromycin');
      expect(cols[2].getLabel().getTooltip().toString()).toMatch('IV/PO');
    });

    it('should group rows for each organism w/ base sampleinfo at top', () => {
      const groups = table.getRowGroups();
      expect(groups.length).toBe(1);
      expect(groups[0].getRange()).toEqual([2, 4]);
    });
  });
});
