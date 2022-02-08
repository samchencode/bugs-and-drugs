import IndexAntibiogramGroupsAction from '@/application/IndexAntibiogramGroupsAction';
import { Interval, Place } from '@/domain/Antibiogram';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';

describe('IndexPlacesAndIntervalsAction - shows unique places and intervals', () => {
  let action: IndexAntibiogramGroupsAction;
  const repo = new FakeAntibiogramRepository();

  beforeEach(() => {
    action = new IndexAntibiogramGroupsAction(repo);
  });

  it('should get groups of places and intervals', () =>
    action.execute().then((result) => {
      expect(result.length).toBe(2);
      const { place: place0, interval: timeInterval0 } = result[0];
      expect(place0.is(new Place('Unknown', 'Unknown'))).toBe(true);
      expect(
        timeInterval0.is(new Interval(new Date(2019, 2), new Date(2020, 1)))
      ).toBe(true);

      const { place: place1, interval: timeInterval1 } = result[1];
      expect(place1.is(new Place('NY', 'Gotham City'))).toBe(true);
      expect(
        timeInterval1.is(new Interval(new Date(2020, 0), new Date(2021, 0)))
      ).toBe(true);
    }));

  it('should set data on presenter', () => {
    const mockPresenter = {
      setData: jest.fn(),
    };

    return action.present(mockPresenter).then((presenter) => {
      expect(presenter.setData).toHaveBeenCalled();

      const calledWith = mockPresenter.setData.mock.calls[0][0];
      const expected = expect.arrayContaining([
        {
          place: expect.any(Place),
          interval: expect.any(Interval),
        },
      ]);

      expect(calledWith).toEqual(expected);
    });
  });
});
