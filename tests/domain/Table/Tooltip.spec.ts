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
  });

  describe('behavior -- single', () => {
    let single: Tooltip;

    beforeEach(() => {
      single = new Tooltip('Hello World');
    });

    it('should get the string value of the tooltip', () => {
      expect(single + '').toBe('Hello World');
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
  });
});
