import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import TableController from '@/infrastructure/view/controllers/TableController';

describe('Table Controller', () => {
  let controller: TableController;

  beforeEach(() => {
    const repo = new FakeAntibiogramRepository();
    const action = new ShowAntibiogramAction(repo);
    controller = new TableController(action);
  });

  it('should get a specified table', () => {
    return controller.showTable(0).then((t) => {
      expect(t.getRowLabels()).toBeDefined();
      expect(t.getColumnLabels()).toBeDefined();
      expect(t.getData()).toBeDefined();
      expect(t.getData().length).toBe(3);
    });
  });

  // TODO: indexes all tables

  // TODO: add/remove filters for all tables

  // TODO: sort list of all tables by ___

  // TODO: add/remove filters for table rows/columns

  // TODO: sort rows/columns by ___
});