import type MetadataValue from '@/domain/Antibiogram/Metadata/MetadataValue';
import ValueObject from '@/domain/base/ValueObject';

class Metadata extends ValueObject {
  #values: Map<string, MetadataValue>;

  constructor(values: MetadataValue[]) {
    super();
    this.#values = new Map(values.map((v) => [v.getSlug(), v]));
  }

  get(slug: string) {
    return this.#values.get(slug);
  }

  protected isIdentical(v: Metadata): boolean {
    for (const [key, value] of this.#values.entries()) {
      if (!v.get(key)?.is(value)) return false;
    }
    return true;
  }
}

export default Metadata;
