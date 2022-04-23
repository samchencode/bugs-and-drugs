import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';

describe('Table Controller', () => {
  let controller: AntibiogramController;

  beforeEach(() => {
    const repo = new FakeAntibiogramRepository();
    const action = new ShowAntibiogramAction(repo);
    controller = new AntibiogramController(action);
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

  it('should present a list of tables given list of id', () => {
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

        expect(table0.grid.length).toBe(3);

        const { table: table1 } = antibiogram2;
        expect(table1.grid).toBeDefined();
        expect(table1.rowHeaders).toBeDefined();
        expect(table1.columnHeaders).toBeDefined();

        expect(table1.grid.length).toBe(4);
      });
  });
});
