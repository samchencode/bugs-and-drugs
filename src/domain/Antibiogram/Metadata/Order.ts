import MetadataValue from '@/domain/Antibiogram/Metadata/MetadataValue';

abstract class Order extends MetadataValue {
  #order: string[];

  constructor(order: string[]) {
    super();
    this.#order = order;
  }

  getValue(): string[] {
    return this.#order;
  }
  isNull() {
    return false;
  }
}

export default Order;
