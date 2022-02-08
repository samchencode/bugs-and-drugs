import IndexAntibiogramGroupsAction from '@/application/IndexAntibiogramGroupsAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
import WebAntibiogramGroupPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';

describe('AntibiogramGroupController', () => {
  let controller: AntibiogramGroupController;
  const repo = new FakeAntibiogramRepository();

  beforeEach(() => {
    const action = new IndexAntibiogramGroupsAction(repo);
    const presenter = new WebAntibiogramGroupPresenter();
    controller = new AntibiogramGroupController(action, presenter);
  });

  it('should create view model based on fake data', () =>
    controller.index().then((result) => {
      expect(result).not.toBeNull();
      if (result === null) return;
      expect(result.length).toBe(2);

      const { state: s0, institution: i0, interval: ti0 } = result[0];
      expect(s0).toBe('Unknown');
      expect(i0).toBe('Unknown');
      expect(ti0).toBe('Mar 2019 \u2212 Feb 2020');

      const { state: s1, institution: i1, interval: ti1 } = result[1];
      expect(s1).toBe('NY');
      expect(i1).toBe('Gotham City');
      expect(ti1).toBe('Jan 2020 \u2212 Jan 2021');
    }));
});
