import { Settings } from '@/domain/Antibiogram';

describe('setting -- a type of sample info', () => {
  it('should hold a setting value', () => {
    const setting = Settings.INPATIENT;
    expect(setting.is(Settings.INPATIENT)).toBe(true);
    expect(setting.is(Settings.OUTPATIENT)).toBe(false);
  });

  it('should convert value to string', () => {
    const setting = Settings.INPATIENT;
    expect(setting.toString()).toBe('Inpatient Setting');
  });

  it('should be identical to another setting of same value', () => {
    const source1 = Settings.INPATIENT;
    const source2 = Settings.INPATIENT;
    expect(source1.is(source2)).toBe(true);
  });
});
