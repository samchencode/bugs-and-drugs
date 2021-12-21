import Antibiogram from '@/domain/Antibiogram';
import SensitivityData from '@/domain/SensitivityData';

describe.skip('Antibiogram', () => {
  it('should create empty antibiogram without data', () => {
    const antibiogram = new Antibiogram([]);
    expect(antibiogram.isEmpty()).toBe(true);
  });

  it('should create antibiogram with sensitivity data', () => {
    const antibiogram = new Antibiogram([
      new SensitivityData('foo bar'),
    ]);

    expect(antibiogram.isEmpty()).toBe(false);
    expect(antibiogram.organisms).toBe(['foo bar']);
  });
});
