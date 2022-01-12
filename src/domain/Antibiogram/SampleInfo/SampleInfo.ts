import ValueObject from '@/domain/base/ValueObject';
import type SampleInfoItem from '@/domain/Antibiogram/SampleInfo/SampleInfoItem';

type SampleInfoItemConstructor = new (...args: never[]) => SampleInfoItem;

class SampleInfo extends ValueObject {
  #itemsByType: Map<string, SampleInfoItem>;
  #itemsByConstructor: Map<SampleInfoItemConstructor, SampleInfoItem>;

  constructor(items: SampleInfoItem[]) {
    super();
    this.#itemsByType = items.reduce(
      (a, v) => a.set(v.getType(), v),
      new Map<string, SampleInfoItem>()
    );
    this.#itemsByConstructor = items.reduce(
      (a, v) => a.set(Object.getPrototypeOf(v).constructor, v),
      new Map<SampleInfoItemConstructor, SampleInfoItem>()
    );
  }

  getItems() {
    return this.#itemsByType;
  }

  getItem(type: string | SampleInfoItemConstructor) {
    if (typeof type === 'string') return this.#itemsByType.get(type);
    return this.#itemsByConstructor.get(type);
  }

  hasItem(value: SampleInfoItem) {
    const type = value.getType();
    const ourValue = this.#itemsByType.get(type);
    if (!ourValue) return false;
    return ourValue.is(value);
  }

  #hasSameKeys(facts: Map<string, SampleInfoItem>): boolean {
    const theirKeys = Array.from(facts.keys());
    const ourKeys = Array.from(this.#itemsByType.keys());
    return areShallowEqual(ourKeys, theirKeys);
  }

  protected isIdentical(v: SampleInfo): boolean {
    if (!this.#hasSameKeys(v.getItems())) return false;
    for (const [key, value] of v.getItems()) {
      const valueIsSame = this.#itemsByType.get(key)?.is(value);
      if (!valueIsSame) return false;
    }
    return true;
  }
}

function areShallowEqual(ourKeys: string[], theirKeys: string[]): boolean {
  if (ourKeys.length !== theirKeys.length) return false;
  for (const key of ourKeys) {
    if (!theirKeys.includes(key)) return false;
  }
  return true;
}

export default SampleInfo;
