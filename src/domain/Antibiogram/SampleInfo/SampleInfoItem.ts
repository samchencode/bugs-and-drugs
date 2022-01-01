import ValueObject from '@/domain/base/ValueObject';

abstract class SampleInfoItem extends ValueObject {
  abstract readonly type: string;
  abstract toString(): string;

  getType() {
    return this.type;
  }
}

export default SampleInfoItem;
