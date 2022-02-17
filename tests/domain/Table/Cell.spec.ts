import { FilledCell } from '@/domain/Table';
import { AlertLevels } from '@/domain/Table/AlertLevel';

describe('Cell', () => {
  describe('instantiation', () => {
    it('should be created with an alert level', () => {
      const cell = new FilledCell('Foo Bar', {
        alert: AlertLevels.INFO,
      });
      expect(cell).toBeDefined();
    });
  });

  describe('behavior', () => {
    it('should get the alert level of the cell', () => {
      const cell = new FilledCell('Foo Bar', {
        alert: AlertLevels.INFO,
      });

      expect(cell.getAlertLevel().is(AlertLevels.INFO)).toBe(true);
    });
  });
});
