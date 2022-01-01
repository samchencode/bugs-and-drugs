import SampleInfoItem from '@/domain/Antibiogram/SampleInfo/SampleInfoItem';
import type SettingValue from '@/domain/Antibiogram/SampleInfo/Setting/SettingValue';

class Setting extends SampleInfoItem {
  type = 'Setting';
  #value: SettingValue;
  constructor(value: SettingValue) {
    super();
    this.#value = value;
  }

  getValue() {
    return this.#value;
  }

  toString(): string {
    return this.#value.toString();
  }

  protected isIdentical(v: Setting): boolean {
    return this.#value.is(v.getValue());
  }
}

export default Setting;
