import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import WebAntibiogramPresenter from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
import WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';
import build from '@/domain/AntibiogramTableBuilder';

describe('WebAntibiogramPresenter', () => {
  let tablePresenter: WebTablePresenter;

  beforeEach(() => {
    tablePresenter = new WebTablePresenter();
  });

  describe('instantiation', () => {
    it('should make a new presenter', () => {
      new WebAntibiogramPresenter(tablePresenter);
    });
  });

  describe('behavior', () => {
    let presenter: WebAntibiogramPresenter;

    beforeEach(() => {
      const antibiogram = FakeAntibiogramRepository.fakeAntibiograms[2];
      const table = build(antibiogram);
      presenter = new WebAntibiogramPresenter(tablePresenter);
      presenter.setData({ antibiogram, table });
    });

    it('should get the antibiogram id', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const vm = presenter.buildViewModel()!;
      expect(vm.antibiogramId).toBe('2');
    });

    it('should get the antibiogram region', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const vm = presenter.buildViewModel()!;
      expect(vm.region).toBe('NY');
    });

    it('should get the antibiogram institution', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const vm = presenter.buildViewModel()!;
      expect(vm.institution).toBe('Gotham City');
    });

    it('should get the antibiogram published date', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const vm = presenter.buildViewModel()!;
      expect(vm.publishedAt).toBe('Jan 2020');
    });

    it('should get the antibiogram expiry date', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const vm = presenter.buildViewModel()!;
      expect(vm.expiresAt).toBe('Jan 2021');
    });

    it('should get the antibiogram gram status', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const vm = presenter.buildViewModel()!;
      expect(vm.gram).toBe('Gram Positive');
    });

    it('should get the antibiogram sample info sample info', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const vm = presenter.buildViewModel()!;
      expect(vm.info).toBe('Inpatient Setting');
    });

    it('should replace empty SI with the word "Antibiogram"', () => {
      const antibiogram = FakeAntibiogramRepository.fakeAntibiograms[0];
      const table = build(antibiogram);
      presenter = new WebAntibiogramPresenter(tablePresenter);
      presenter.setData({ antibiogram, table });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const vm = presenter.buildViewModel()!;
      expect(vm.info).toBe('Antibiogram');
    });
  });
});
