import type Antibiogram from '@/domain/Antibiogram';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import WebAntibiogramGroupPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';

describe('WebAntibiogramGroupPresenter', () => {
  // Place -> Time -> SI -> G+/-

  describe('instantiation', () => {
    it('should make a new presenter instance', () => {
      new WebAntibiogramGroupPresenter();
    });
  });

  describe('behavior', () => {
    let presenter: WebAntibiogramGroupPresenter;
    let data: Antibiogram[];

    beforeEach(() => {
      data = FakeAntibiogramRepository.fakeAntibiograms;
      presenter = new WebAntibiogramGroupPresenter();
      presenter.setData(data);
    });

    it('should create a view model with a list of groups', () => {
      const vm = presenter.buildViewModel();

      expect(vm).not.toBeNull();
      expect(vm).toBeInstanceOf(Array);
    });

    it('should create vm with data grouped by place', () => {
      const vm = presenter.buildViewModel();
      const expected = expect.arrayContaining([
        {
          place: expect.any(String),
          intervals: expect.anything(),
        },
      ]);
      expect(vm).toEqual(expected);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(vm![1].place).toBe('Gotham City \u2212 NY');
    });

    it('should create vm with data grouped by place and interval', () => {
      const vm = presenter.buildViewModel();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [place0, place1] = vm!;

      const expected = expect.arrayContaining([
        {
          interval: expect.any(String),
          groups: expect.anything(),
        },
      ]);

      expect(place0.intervals).toEqual(expected);
      expect(place1.intervals).toEqual(expected);

      expect(place0.intervals[0].interval).toBe('Mar 2019 \u2212 Feb 2020');
    });

    it('should create vm with data grouped by place, interval, and si group', () => {
      const vm = presenter.buildViewModel();

      const [
        {
          intervals: [i0],
        },
        {
          intervals: [i1],
        },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ] = vm!;

      const expected = expect.arrayContaining([
        {
          title: expect.any(String),
          antibiograms: expect.arrayContaining([
            { gram: expect.any(String), id: expect.any(String) },
          ]),
        },
      ]);

      expect(i0.groups).toEqual(expected);
      expect(i1.groups).toEqual(expected);

      expect(i0.groups[0].title).toBe('Antibiogram');
      expect(i1.groups[0].title).toBe('Antibiogram');
      expect(i1.groups[1].title).toBe('Inpatient Setting');
    });
  });
});
