import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import buildAntibiogramTable from '@/domain/AntibiogramTableBuilder';
import Antibiogram, { AntibiogramId } from '@/domain/Antibiogram';

describe('make table using antibiogram', () => {
  it('creates table using empty antibiogram', () => {
    const abg = new Antibiogram(new AntibiogramId('0'), []);
    const table = buildAntibiogramTable(abg);
    expect(table.getCells()).toEqual([]);
  });

  describe('with data', () => {
    let abg: Antibiogram;

    beforeEach(() => {
      return new FakeAntibiogramRepository().getAll().then(([res]) => {
        abg = res;
      });
    });

    it('creates table using antibiogram', () => {
      const table = buildAntibiogramTable(abg);
      const rLabels = table.getRowLabels();
      const cLabels = table.getColumnLabels();
      expect(rLabels.map((x) => x.toString())).toEqual(
        expect.arrayContaining(['Klebsiella', 'Pseudomonas', 'Staph aureus'])
      );
      expect(cLabels.map((x) => x.toString())).toEqual(
        expect.arrayContaining(['Azithromycin'])
      );

      const data = table.getCells();
      expect(data).toEqual(expect.arrayContaining([expect.any(Array)]));
      expect(data.length).toBe(3);

      expect(table.getShape()).toEqual([3, 2]);
    });
  });
});
