import IndexAntibiogramAction from '@/application/IndexAntibiogramAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
import WebAntibiogramGroupPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';

describe('AntibiogramGroupController', () => {
  let controller: AntibiogramGroupController;
  const repo = new FakeAntibiogramRepository();

  beforeEach(() => {
    const action = new IndexAntibiogramAction(repo);
    const presenter = new WebAntibiogramGroupPresenter();
    controller = new AntibiogramGroupController(action, presenter);
  });

  it('should create view model based on fake data', () =>
    controller.index().then((result) => {
      expect(result).not.toBeNull();
      if (!result) throw Error();

      expect(result[0].place).toBe('Unknown \u2212 Unknown');
      expect(result[1].place).toBe('Gotham City \u2212 NY');
      expect(result[0].intervals[0].interval).toBe('Mar 2019 \u2212 Feb 2020');
      expect(result[1].intervals[0].interval).toBe('Jan 2020 \u2212 Jan 2021');
      expect(result[0].intervals[0].groups[0].title).toBe('');
      expect(result[1].intervals[0].groups[0].title).toBe('');
      expect(result[1].intervals[0].groups[1].title).toBe('Inpatient Setting');
      expect(result[0].intervals[0].groups[0].antibiograms[0].gram).toBe(
        'Gram Unspecified'
      );
      expect(result[0].intervals[0].groups[0].antibiograms[0].id).toBe('0');
      expect(result[1].intervals[0].groups[0].antibiograms[0].id).toBe('1');
      expect(result[1].intervals[0].groups[1].antibiograms[0].id).toBe('2');
    }));
});
