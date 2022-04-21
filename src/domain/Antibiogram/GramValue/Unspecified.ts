import GramValue from '@/domain/Antibiogram/GramValue/GramValue';

class Unspecified extends GramValue {
  toString(): string {
    return 'Gram positive and negative';
  }
}

export default Unspecified;
