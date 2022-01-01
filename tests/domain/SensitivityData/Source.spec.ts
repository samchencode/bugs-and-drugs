import Source, { Sources } from '@/domain/Antibiogram/SampleInfo/Source';

describe('infectious source -- a type of sample info', () => {
  it('should hold a source value', () => {
    const source = new Source(Sources.URINE);
    expect(source.getValue().is(Sources.URINE)).toBe(true);
    expect(source.getValue().is(Sources.NONURINE)).toBe(false);
  });

  it('should convert value to string', () => {
    const source = new Source(Sources.URINE);
    expect(source.toString()).toBe('Urine');
  });

  it('should be identical to another source of same value', () => {
    const source1 = new Source(Sources.URINE);
    const source2 = new Source(Sources.URINE);
    expect(source1.is(source2)).toBe(true);
  });
});
