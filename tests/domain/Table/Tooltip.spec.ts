import { AlertLevels } from '@/domain/Table/AlertLevel';
import Tooltip from '@/domain/Table/Tooltip';

describe('Tooltip', () => {
  describe('instantiation', () => {
    it('should create a new tooltip with a containing', () => {
      const t = new Tooltip('Hello World');
      expect(t).toBeDefined();
    });

    it('should create a tooltip as a composite of tooltips', () => {
      const leaf1 = new Tooltip('leaf 1');
      const leaf2 = new Tooltip('leaf 2');
      const root = new Tooltip([leaf1, leaf2]);

      expect(root).toBeDefined();
    });

    it('should create an empty tooltip', () => {
      const empty = new Tooltip();
      expect(empty).toBeDefined();
    });
  });

  describe('behavior -- empty', () => {
    let empty: Tooltip;

    beforeEach(() => {
      empty = new Tooltip();
    });

    it('should return empty string', () => {
      expect(empty + '').toBe('');
    });

    it('should always have an alert level of none', () => {
      expect(empty.getAlertLevel().is(AlertLevels.NONE)).toBe(true);

      // @ts-expect-error testing inappropriate assignment of AlertLevel to empty
      const tWarn = new Tooltip(undefined, AlertLevels.ERROR);
      expect(tWarn.getAlertLevel().is(AlertLevels.NONE)).toBe(true);
    });
  });

  describe('behavior -- single', () => {
    let single: Tooltip;

    beforeEach(() => {
      single = new Tooltip('Hello World');
    });

    it('should get the string value of the tooltip', () => {
      expect(single + '').toBe('Hello World');
    });

    it('should have an alert level of none by default', () => {
      expect(single.getAlertLevel().is(AlertLevels.NONE)).toBe(true);
    });

    it('should save an alert level at instantiation', () => {
      const sWarn = new Tooltip('Foo Bar', AlertLevels.WARN);
      expect(sWarn.getAlertLevel().is(AlertLevels.WARN));
    });
  });

  describe('behavior -- composite', () => {
    let composite: Tooltip;

    beforeEach(() => {
      const leaf1 = new Tooltip('leaf 1');
      const leaf2 = new Tooltip('leaf 2');
      composite = new Tooltip([leaf1, leaf2]);
    });

    it('should get a combined string value of all leaf tooltips', () => {
      expect(composite + '').toBe('leaf 1\nleaf 2');
    });

    it('should have an alert level of none by default', () => {
      expect(composite.getAlertLevel().is(AlertLevels.NONE)).toBe(true);
    });

    it('should have the max alert level of its constituents', () => {
      const l1 = new Tooltip('1');
      const l2 = new Tooltip('2', AlertLevels.WARN);
      const l3 = new Tooltip('3', AlertLevels.ERROR);

      const composite = new Tooltip([l1, l2, l3]);
      expect(composite.getAlertLevel().is(AlertLevels.ERROR)).toBe(true);
    });
  });
});
