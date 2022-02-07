import FindAntibiogramsByPlaceAndIntervalAction from '@/application/FindAntibiogramsByPlaceAndIntervalAction';
import { AntibiogramId, Interval, Place } from '@/domain/Antibiogram';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';

describe('FindAntibiogramsByPlaceAndIntervalAction', () => {
  let action: FindAntibiogramsByPlaceAndIntervalAction;

  beforeEach(() => {
    action = new FindAntibiogramsByPlaceAndIntervalAction(
      new FakeAntibiogramRepository()
    );
  });

  it('should return antibiograms that belong to a place-timeinterval group', () => {
    const place = new Place('NY', 'Gotham City');
    const interval = new Interval(new Date(2020, 0), new Date(2021, 0));

    return action.execute(place, interval).then((results) => {
      expect(results.length).toBe(2);
      expect(results[0].id.is(new AntibiogramId('1'))).toBe(true);
      expect(results[1].id.is(new AntibiogramId('2'))).toBe(true);
    });
  });
});
