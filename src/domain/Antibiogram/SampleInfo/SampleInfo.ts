import ValueObject from '@/domain/base/ValueObject';
import type SampleInfoItem from '@/domain/Antibiogram/SampleInfo/SampleInfoItem';

class SampleInfo extends ValueObject {
  #facts: Map<string, SampleInfoItem>;

  constructor(facts: SampleInfoItem[]) {
    super();
    this.#facts = facts.reduce((ag, v) => {
      ag.set(v.getType(), v);
      return ag;
    }, new Map<string, SampleInfoItem>());
  }

  getItems() {
    return this.#facts;
  }

  getItem(type: string) {
    return this.#facts.get(type);
  }

  #hasSameKeys(facts: Map<string, SampleInfoItem>): boolean {
    const theirKeys = Array.from(facts.keys());
    const ourKeys = Array.from(this.#facts.keys());
    return areShallowEqual(ourKeys, theirKeys);
  }

  protected isIdentical(v: SampleInfo): boolean {
    this.#hasSameKeys(v.getItems());
    for (const [key, value] of v.getItems()) {
      const valueIsSame = this.#facts.get(key)?.is(value);
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
