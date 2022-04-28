import ValueObject from '@/domain/base/ValueObject';

abstract class MetadataValue extends ValueObject {
  static slug = 'value';
  abstract getSlug(): string;
  abstract getValue(): string[];

  protected isIdentical(v: MetadataValue): boolean {
    if (v.getValue().length !== this.getValue().length) return false;
    if (v.getValue().find((f, i) => this.getValue()[i] !== f)) return false;
    return true;
  }
}

export default MetadataValue;
