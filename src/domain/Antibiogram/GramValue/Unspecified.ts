import GramValue from '@/domain/Antibiogram/GramValue/GramValue';

class Unspecified extends GramValue {
  toString(): string {
    return 'Gram Unspecified';
  }
}

export default Unspecified;
