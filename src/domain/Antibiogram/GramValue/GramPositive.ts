import GramValue from '@/domain/Antibiogram/GramValue/GramValue';

class GramPositive extends GramValue {
  toString(): string {
    return 'Gram Positive';
  }
}

export default GramPositive;
