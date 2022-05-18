import ValueObject from '@/domain/base/ValueObject';

abstract class MetadataValue extends ValueObject {
  static slug = 'value';
  abstract getSlug(): string;
  abstract isNull(): boolean;
  protected abstract isIdentical(v: ValueObject): boolean;
}

export default MetadataValue;
