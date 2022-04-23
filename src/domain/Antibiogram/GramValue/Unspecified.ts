import GramValue from '@/domain/Antibiogram/GramValue/GramValue';

class Unspecified extends GramValue {
  toString(): string {
    return 'Gram Positive and Negative';
  }
}

export default Unspecified;
