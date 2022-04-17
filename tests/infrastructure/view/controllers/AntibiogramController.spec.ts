import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
import WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';

describe('Table Controller', () => {
  let controller: AntibiogramController;

  beforeEach(() => {
    const repo = new FakeAntibiogramRepository();
    const action = new ShowAntibiogramAction(repo);
    const presenter = new WebTablePresenter();
    controller = new AntibiogramController(action, presenter);
  });

  it('should present a specified table', () => {
    return controller.show('0').then((t) => {
      expect(t).not.toBeNull();
      if (!t) throw Error();

      expect(t.grid).toBeDefined();
      expect(t.rowHeaders).toBeDefined();
      expect(t.columnHeaders).toBeDefined();

      expect(t.grid.length).toBe(3);
    });
  });
});
