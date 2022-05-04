import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import ShowGramPositiveAndNegativeAntibiogramAction from '@/application/ShowGramPositiveAndNegativeAntibiogramAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';

describe('Table Controller', () => {
  let controller: AntibiogramController;

  beforeEach(() => {
    const repo = new FakeAntibiogramRepository();
    const action = new ShowAntibiogramAction(repo);
    const action2 = new ShowGramPositiveAndNegativeAntibiogramAction(repo);
    controller = new AntibiogramController(action, action2);
  });

  it('should present a specified table', () => {
    return controller.show('0').then((antibiogram) => {
      expect(antibiogram).not.toBeNull();
      if (!antibiogram) throw Error;

      const { table } = antibiogram;
      expect(table.grid).toBeDefined();
      expect(table.rowHeaders).toBeDefined();
      expect(table.columnHeaders).toBeDefined();

      expect(table.grid.length).toBe(3);
    });
  });

  it('should present g+ and g- abgs in one table', () => {
    return controller.showComposite('0', '2').then((abg) => {
      expect(abg).not.toBeNull();
      if (!abg) throw Error;

      const { table } = abg;
      expect(table.grid.length).toBe(9);

      const labels = table.rowHeaders.map((l) => l.getValue());
      expect(labels[0]).toBe('Gram Positive');
      expect(labels[5]).toBe('Gram Positive and Negative');
    });
  });

  it('should make vms for a list of ids', () => {
    return controller
      .showMany(['0', '2'])
      .then(([antibiogram0, antibiogram2]) => {
        expect(antibiogram0).not.toBeNull();
        expect(antibiogram2).not.toBeNull();
        if (!antibiogram0 || !antibiogram2) throw Error;

        const { table: table0 } = antibiogram0;
        expect(table0.grid).toBeDefined();
        expect(table0.rowHeaders).toBeDefined();
        expect(table0.columnHeaders).toBeDefined();

        const { table: table1 } = antibiogram2;
        expect(table1.grid).toBeDefined();
        expect(table1.rowHeaders).toBeDefined();
        expect(table1.columnHeaders).toBeDefined();
      });
  });

  it('should sort the vms so gram negative comes first', () => {
    return controller.showMany(['2', '1']).then(([first, second]) => {
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      if (!first || !second) throw Error;

      expect(first.gram).toBe('Gram Negative');
      expect(second.gram).toBe('Gram Positive');
    });
  });
});
