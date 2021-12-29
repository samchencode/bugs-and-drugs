import ValueObject from '@/domain/base/ValueObject';

abstract class EntityId extends ValueObject {
  #value: string;

  constructor(id: string) {
    super();
    this.#value = id;
  }

  getValue() {
    return this.#value;
  }

  protected isIdentical(v: EntityId): boolean {
    return this.#value === v.getValue();
  }
}

export default EntityId;
