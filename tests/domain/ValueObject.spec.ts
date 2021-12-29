import ValueObject from '@/domain/base/ValueObject';

describe('value object', () => {
  class A extends ValueObject {
    value: number;

    constructor(val: number) {
      super();
      this.value = val;
    }
    protected isIdentical(v: A): boolean {
      return this.value === v.value;
    }
  }

  it('should recognize when value objects are identical', () => {
    const one = new A(1);
    const two = new A(2);
    const one2 = new A(1);

    expect(one.is(one2)).toBe(true);
    expect(one.is(two)).toBe(false);
    expect(one.is(one)).toBe(true);
  });

  it('should filter for unique value objects', () => {
    const arr = [new A(1), new A(2), new A(3), new A(1)];
    const uniqueValues = ValueObject.filterUniqueValues(arr);
    expect(uniqueValues).toEqual([expect.any(A), expect.any(A), expect.any(A)]);
    expect(uniqueValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 1 }),
        expect.objectContaining({ value: 2 }),
        expect.objectContaining({ value: 3 }),
      ])
    );
  });
});
