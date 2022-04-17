import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
import WebAntibiogramPresenter from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
import WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';

describe('Table Controller', () => {
  let controller: AntibiogramController;

  beforeEach(() => {
    const repo = new FakeAntibiogramRepository();
    const action = new ShowAntibiogramAction(repo);
    const tablePresenter = new WebTablePresenter();
    const presenter = new WebAntibiogramPresenter(tablePresenter);
    controller = new AntibiogramController(action, presenter);
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
