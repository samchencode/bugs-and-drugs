import SensitivityValue from '@/domain/Antibiogram/SensitivityValue';

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

  it('should round any decimal values on toString', () => {
    const zero = new SensitivityValue('0.1');
    const one = new SensitivityValue('1.1');
    const two = new SensitivityValue('1.9');

    expect(zero.toString()).toBe('0%');
    expect(one.toString()).toBe('1%');
    expect(two.toString()).toBe('2%');
  });
});
