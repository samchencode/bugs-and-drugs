import Interval, { DefaultInterval } from '@/domain/Antibiogram/Interval';

describe('Interval - a time interval during which the antibiogram is valid', () => {
  describe('instantiation', () => {
    it('should create an interval', () => {
      const i = new Interval(new Date(), new Date());
      expect(i).toBeDefined();
    });
  });

  describe('behavior', () => {
    let int: Interval;

    beforeEach(() => {
      int = new Interval(new Date(2020, 0), new Date(2021, 0));
    });

    it('should retrieve expiry and publish dates', () => {
      const publishedYear = int.getPublishedDate().getFullYear();
      const expiryYear = int.getExpiryDate().getFullYear();

      expect(publishedYear).toBe(2020);
      expect(expiryYear).toBe(2021);
    });

    it('should compare two intervals', () => {
      const int2 = new Interval(new Date(2020, 0), new Date(2021, 0));
      const diffInt = new Interval(new Date(), new Date(2023, 0));

      expect(int.is(int2)).toBe(true);
      expect(int.is(diffInt)).toBe(false);
    });

    it('should create a human readable interval string', () => {
      expect(int.toString()).toBe('Jan 2020 \u2212 Jan 2021');
    });

    it('should create defaultInterval with todays year', () => {
      const def = new DefaultInterval();
      const thisYear = new Date().getFullYear();
      expect(def.toString()).toBe(`Jan ${thisYear} \u2212 Jan ${thisYear + 1}`);
    });
  });
});
