import SensitivityValue from '@/domain/SensitivityValue';

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
})