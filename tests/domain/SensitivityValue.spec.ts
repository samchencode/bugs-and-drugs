import SensitivityValue from '@/domain/SensivityValue/SensitivityValue';

describe('Sensitivity Value', () => {
  it('should be instantiated with a value', () => {
    const value = new SensitivityValue('90');
    expect(value).toBeDefined();
  })

  it('should retrieve its value', () => {
    const value1 = new SensitivityValue('90');
    expect(value1.getValue()).toBe(90);

    const value2 = new SensitivityValue('R');
    expect(value2.getValue()).toBe('R');
  });

  it('should be resistant', () => {
    const value = new SensitivityValue('R');
    expect(value.isResistent()).toBe(true);
    expect(value.getValue()).toBe('R');
  })
})