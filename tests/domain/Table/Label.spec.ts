import { Label } from '@/domain/Table';

describe('Label', () => {
  describe('behavior', () => {
    it('should be equal to a label with identical title', () => {
      const result = new Label('label').is(new Label('label'));
      expect(result).toBe(true);
    });
  });
});
