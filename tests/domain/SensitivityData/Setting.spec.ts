import Setting, { Settings } from '@/domain/Antibiogram/SampleInfo/Setting';

describe('setting -- a type of sample info', () => {
  it('should hold a setting value', () => {
    const setting = new Setting(Settings.INPATIENT);
    expect(setting.getValue().is(Settings.INPATIENT)).toBe(true);
    expect(setting.getValue().is(Settings.OUTPATIENT)).toBe(false);
  });

  it('should convert value to string', () => {
    const setting = new Setting(Settings.INPATIENT);
    expect(setting.toString()).toBe('Inpatient Setting');
  });

  it('should be identical to another setting of same value', () => {
    const source1 = new Setting(Settings.INPATIENT);
    const source2 = new Setting(Settings.INPATIENT);
    expect(source1.is(source2)).toBe(true);
  });
});
