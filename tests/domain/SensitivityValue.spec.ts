import SensitivityValue from '@/domain/SensivityValue';

describe('Sensitivity Value', () => {
  it('should be instantiated with a value', () => {
    const value = new SensitivityValue('90');
    expect(value).toBeDefined();
  });

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
  });

  it('should not allow a percent sensitive > 100%', () => {
    const boom = () => new SensitivityValue('101');
    expect(boom).toThrowError('Invalid sensitivity value');
  });

  it('should not allow non-numeric percent sensitive values other than R', () => {
    const boom = () => new SensitivityValue('Foo Bar');
    expect(boom).toThrowError('Invalid sensitivity value');
    const boom2 = () => new SensitivityValue('   ');
    expect(boom2).toThrowError('Invalid sensitivity value');
  });

  it('should not allow negative percent sensitive', () => {
    const boom = () => new SensitivityValue('-1');
    expect(boom).toThrowError('Invalid sensitivity value');
  });
});
