import { Interval, Place } from '@/domain/Antibiogram';
import WebAntibiogramGroupPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';

describe('WebAntibiogramGroupPresenter -- creates a ViewModel for use in the Web App', () => {
  describe('instantiation', () => {
    new WebAntibiogramGroupPresenter();
  });

  describe('behavior', () => {
    let presenter: WebAntibiogramGroupPresenter;

    beforeEach(() => {
      presenter = new WebAntibiogramGroupPresenter();
      presenter.setData([
        {
          place: new Place('NY', 'Gotham City'),
          interval: new Interval(new Date(2021, 0), new Date(2022, 0)),
        },
      ]);
    });

    it('should create a view model with a list of groups', () => {
      const result = presenter.buildViewModel();
      expect(result).not.toBeNull();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [{ state, institution, interval }] = result!;
      expect(state).toBe('NY');
      expect(institution).toBe('Gotham City');
      expect(interval).toBe('Jan 2021 \u2212 Jan 2022');
    });
  });
});
