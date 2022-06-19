abstract class ValueObject {
  protected abstract isIdentical(v: ValueObject): boolean;

  is(v: ValueObject | undefined) {
    if (v == undefined) return false;
    const { constructor } = Object.getPrototypeOf(v);
    if (!(this instanceof constructor)) return false;
    return this.isIdentical(v);
  }

  static filterUniqueValues<T extends ValueObject>(arr: T[]) {
    const uniqueValues: T[] = [];

    for (const val of arr) {
      const match = uniqueValues.find((v) => v.isIdentical(val));
      const seen = !(typeof match === 'undefined');
      if (seen) continue;
      uniqueValues.push(val);
    }

    return uniqueValues;
  }
}

export default ValueObject;
