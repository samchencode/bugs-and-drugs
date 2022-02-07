import IndexPlacesAndIntervalsAction from '@/application/IndexPlacesAndIntervalsAction';
import { Interval, Place } from '@/domain/Antibiogram';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';

describe('IndexPlacesAndIntervalsAction - shows unique places and intervals', () => {
  let action: IndexPlacesAndIntervalsAction;

  beforeEach(() => {
    action = new IndexPlacesAndIntervalsAction(new FakeAntibiogramRepository());
  });

  it('should get groups of places and intervals', () =>
    action.execute().then((result) => {
      expect(result.length).toBe(2);
      const [place0, timeInterval0] = result[0];
      expect(place0.is(new Place('Unknown', 'Unknown'))).toBe(true);
      expect(
        timeInterval0.is(new Interval(new Date(2019, 2), new Date(2020, 1)))
      ).toBe(true);

      const [place1, timeInterval1] = result[1];
      expect(place1.is(new Place('NY', 'Gotham City'))).toBe(true);
      expect(
        timeInterval1.is(new Interval(new Date(2020, 0), new Date(2021, 0)))
      ).toBe(true);
    }));
});
