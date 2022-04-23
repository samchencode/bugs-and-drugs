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
});
