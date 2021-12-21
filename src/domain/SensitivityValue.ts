class SensitivityValue {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  isResistent() {
    return this.value === 'R';
  }

  getValue() {
    return this.isResistent() ? 'R' : Number.parseInt(this.value);
  }

  toString() {
    return this.isResistent() ? this.value : this.value + ' %';
  }

  valueOf() {
    return this.isResistent() ? NaN : Number.parseInt(this.value);
  }
}
export default SensitivityValue;
