import GramValue from '@/domain/Antibiogram/GramValue/GramValue';

class GramNegative extends GramValue {
  toString(): string {
    return 'Gram Negative';
  }
}

export default GramNegative;
