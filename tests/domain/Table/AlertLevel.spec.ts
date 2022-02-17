import { AlertLevel, AlertLevels } from '@/domain/Table/AlertLevel';

describe('AlertLevel', () => {
  describe('instantiation', () => {
    it('should create objects representing alert levels using js getter', () => {
      const l0 = AlertLevels.INFO;
      expect(l0).toBeInstanceOf(AlertLevel);

      const l1 = AlertLevels.WARN;
      expect(l1).toBeInstanceOf(AlertLevel);

      const l2 = AlertLevels.ERROR;
      expect(l2).toBeInstanceOf(AlertLevel);
    });
  });

  describe('behavior', () => {
    let l0: AlertLevel;
    let l1: AlertLevel;
    let l2: AlertLevel;

    beforeEach(() => {
      l0 = AlertLevels.INFO;
      l1 = AlertLevels.WARN;
      l2 = AlertLevels.ERROR;
    });

    it('should test equality', () => {
      expect(l0.is(AlertLevels.INFO)).toBe(true);
      expect(l1.is(l2)).toBe(false);
    });

    it('should compare levels', () => {
      expect(l0 < l1).toBe(true);
      expect(l2 < l1).toBe(false);
    });
  });
});
